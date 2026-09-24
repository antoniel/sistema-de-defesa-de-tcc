"""Testes da lógica de corte do `demo_cut.py`.

Só a decisão de quais pedaços manter é testada aqui — é a parte que pode errar de forma
silenciosa. O render com ffmpeg é validado à parte, com um vídeo sintético de durações
conhecidas (ver docs/verification.md).

Rodar:
    python3 -m unittest discover -s scripts -p 'test_demo_cut*.py'
"""

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("demo_cut", Path(__file__).with_name("demo_cut.py"))
demo_cut = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo_cut)

SCRIPT = Path(__file__).with_name("demo_cut.py")


def kept(segments):
    return round(sum(end - start for start, end in segments), 3)


class BuildSegmentsTest(unittest.TestCase):
    """
    Segmentos contíguos são unidos de propósito: cortar num ponto onde nada foi removido
    só cria um corte a mais. Por isso `(0,3) + (3,3.6)` vira `(0,3.6)`.
    """

    def test_sem_pausa_mantem_o_video_inteiro(self):
        self.assertEqual(demo_cut.build_segments(10.0, [], keep=0.6), [(0.0, 10.0)])

    def test_pausa_no_meio_e_encurtada_para_o_keep(self):
        # Pausa de 4s (3→7) com keep de 0.6s: mantém 0→3.6 e pula direto para 7.
        segments = demo_cut.build_segments(10.0, [(3.0, 7.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 3.6), (7.0, 10.0)])
        self.assertEqual(kept(segments), 6.6)

    def test_pausa_no_inicio_preserva_o_comeco(self):
        segments = demo_cut.build_segments(10.0, [(0.0, 5.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 0.6), (5.0, 10.0)])

    def test_pausa_no_fim_preserva_o_comeco_da_pausa(self):
        # O hold final do resultado é uma pausa: preserva o começo dela.
        segments = demo_cut.build_segments(10.0, [(8.0, 10.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 8.6)])

    def test_pausa_menor_que_o_keep_nao_remove_nada(self):
        segments = demo_cut.build_segments(10.0, [(4.0, 4.4)], keep=0.6)
        self.assertEqual(segments, [(0.0, 10.0)])

    def test_pausas_adjacentes_geram_um_keep_para_cada(self):
        segments = demo_cut.build_segments(10.0, [(3.0, 5.0), (5.0, 7.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 3.6), (5.0, 5.6), (7.0, 10.0)])

    def test_segmento_menor_que_o_minimo_e_descartado(self):
        # Sobra só 0.1s depois da pausa, abaixo de MIN_SEGMENT.
        segments = demo_cut.build_segments(10.0, [(9.9, 10.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 9.9)])

    def test_pausa_maior_que_o_video_nao_estoura_o_limite(self):
        segments = demo_cut.build_segments(10.0, [(2.0, 99.0)], keep=0.6)
        self.assertEqual(segments, [(0.0, 2.6)])

    def test_segmentos_nunca_passam_do_fim_do_video(self):
        segments = demo_cut.build_segments(10.0, [(5.0, 12.0)], keep=5.0)
        self.assertTrue(segments)
        for _, end in segments:
            self.assertLessEqual(end, 10.0)

    def test_video_longo_com_muitas_pausas_encolhe_bastante(self):
        # Reproduz o caso real: 43s de gravação com 7 pausas de "pensamento".
        freezes = [(0.0, 5.3), (5.4, 20.1), (20.3, 22.7), (22.7, 25.7), (26.0, 30.8), (30.8, 37.2), (37.3, 43.4)]
        segments = demo_cut.build_segments(43.4, freezes, keep=0.6)
        self.assertLess(kept(segments), 6.0)
        self.assertGreater(kept(segments), 2.0)


class CliTest(unittest.TestCase):
    def test_recusa_escrever_dentro_do_diretorio_de_captura(self):
        with tempfile.TemporaryDirectory() as folder:
            capture = Path(folder) / "capture"
            capture.mkdir()
            (capture / "capture.json").write_text("{}")
            video = capture / "interaction.mp4"
            video.write_bytes(b"nao importa")

            result = subprocess.run([sys.executable, str(SCRIPT), str(video)], capture_output=True, text=True)

            self.assertEqual(result.returncode, 1)
            self.assertIn("diretório de captura gerenciado", result.stderr)

    def test_aceita_saida_fora_do_diretorio_de_captura(self):
        with tempfile.TemporaryDirectory() as folder:
            capture = Path(folder) / "capture"
            capture.mkdir()
            (capture / "capture.json").write_text("{}")
            video = capture / "interaction.mp4"
            video.write_bytes(b"nao importa")

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(video), "-o", str(Path(folder) / "demo.mp4"), "--dry-run"],
                capture_output=True,
                text=True,
            )

            # Passa da checagem do diretório e falha depois, por não ser um vídeo válido.
            self.assertNotIn("diretório de captura gerenciado", result.stderr)


if __name__ == "__main__":
    unittest.main()
