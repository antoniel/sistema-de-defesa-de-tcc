#!/usr/bin/env python3
"""Gera um vídeo de demonstração fluido a partir de uma captura do verify-app.

O vídeo gravado pelo verify-app é EVIDÊNCIA: contínuo, sem cortes, validado por
`evidence.py check`. Enquanto o agente pensa entre uma ação e outra, a tela fica parada,
e isso aparece como tempo morto.

Este script NÃO toca na evidência. Ele lê a gravação e escreve um derivado, com os
trechos parados removidos, para uso como demo (PR, apresentação, revisão humana).

Regra da skill que isto respeita: "Keep original media unchanged. Store diagnostic
derivatives outside the managed capture directory."

Uso:
    python3 scripts/demo_cut.py gravacao.mp4
    python3 scripts/demo_cut.py gravacao.mp4 -o demo.mp4 --min-freeze 1.0 --keep 0.6
    python3 scripts/demo_cut.py gravacao.mp4 --dry-run --report

Como funciona:
    1. `freezedetect` do ffmpeg marca os intervalos em que a imagem não muda.
    2. Cada intervalo parado é encurtado para no máximo `--keep` segundos (o começo é
       preservado, porque é ali que está o resultado da última ação, que precisa ser lido).
    3. Os pedaços restantes são concatenados numa passada só de ffmpeg.

Só entram no corte os trechos parados maiores que `--min-freeze`, para não engolir as
pausas curtas e naturais (leitura de tela, tempo de resposta da interface).
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Intervalo considerado "parado". -60dB é bem estrito (quase sem ruído de compressão).
DEFAULT_THRESHOLD = "-60dB"
# Trechos parados menores que isto são pausas naturais e ficam.
DEFAULT_MIN_FREEZE = 1.0
# Quanto do começo de cada trecho parado é preservado.
DEFAULT_KEEP = 0.6
# Menor segmento que vale a pena manter no resultado.
MIN_SEGMENT = 0.2

FREEZE_LINE = re.compile(
    r"freeze_start=(?P<start>[\d.]+)|freeze_end=(?P<end>[\d.]+)|freeze_duration=(?P<duration>[\d.]+)"
)


class DemoCutError(Exception):
    pass


def require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise DemoCutError(f"{name} não encontrado no PATH. Instale o ffmpeg.")


def probe_duration(video: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(video),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError as error:
        raise DemoCutError(f"Não consegui ler a duração de {video}") from error


def find_freezes(video: Path, threshold: str, min_freeze: float) -> list[tuple[float, float]]:
    """Roda freezedetect e devolve os intervalos parados, já filtrados por duração."""
    command = [
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-i",
        str(video),
        "-vf",
        f"freezedetect=n={threshold}:d={min_freeze},metadata=mode=print:file=-",
        "-map",
        "0:v",
        "-f",
        "null",
        "-",
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise DemoCutError(f"freezedetect falhou:\n{result.stderr[-800:]}")

    freezes: list[tuple[float, float]] = []
    pending_start: float | None = None
    for line in result.stdout.splitlines():
        match = FREEZE_LINE.search(line)
        if not match:
            continue
        if match.group("start") is not None:
            pending_start = float(match.group("start"))
        elif match.group("end") is not None and pending_start is not None:
            freezes.append((pending_start, float(match.group("end"))))
            pending_start = None
    # Um freeze que chegou ao fim do vídeo sem `freeze_end` ainda conta.
    if pending_start is not None:
        freezes.append((pending_start, probe_duration(video)))
    return freezes


def build_segments(duration: float, freezes: list[tuple[float, float]], keep: float) -> list[tuple[float, float]]:
    """Converte os freezes em pedaços a manter: encurta cada freeze para `keep` segundos."""
    segments: list[tuple[float, float]] = []
    cursor = 0.0
    for start, end in freezes:
        if start > cursor:
            segments.append((cursor, min(start, duration)))
        # Preserva o começo do freeze (onde está o resultado da ação anterior) e descarta o resto.
        trimmed_end = min(start + keep, end)
        if trimmed_end > start:
            segments.append((start, trimmed_end))
        cursor = max(cursor, end)
    if cursor < duration:
        segments.append((cursor, duration))

    merged: list[tuple[float, float]] = []
    for start, end in segments:
        start = max(0.0, start)
        end = min(duration, end)
        if end - start < MIN_SEGMENT:
            continue
        if merged and start - merged[-1][1] < 0.01:
            merged[-1] = (merged[-1][0], end)
        else:
            merged.append((start, end))
    return merged


def render(video: Path, output: Path, segments: list[tuple[float, float]]) -> None:
    if len(segments) == 1 and segments[0][0] == 0:
        raise DemoCutError("Nada para cortar: nenhum trecho parado acima do limite.")
    parts = []
    labels = []
    for index, (start, end) in enumerate(segments):
        parts.append(f"[0:v]trim=start={start:.3f}:end={end:.3f},setpts=PTS-STARTPTS[v{index}]")
        labels.append(f"[v{index}]")
    filter_complex = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(segments)}:v=1:a=0[out]"

    command = [
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-loglevel",
        "error",
        "-i",
        str(video),
        "-filter_complex",
        filter_complex,
        "-map",
        "[out]",
        "-an",
        # Mesmos parâmetros da captura original, para a demo ficar idêntica em qualidade.
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-y",
        str(output),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise DemoCutError(f"ffmpeg falhou ao renderizar:\n{result.stderr[-800:]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", type=Path, help="gravação de origem (a evidência, que não é alterada)")
    parser.add_argument("-o", "--output", type=Path, help="arquivo de saída (padrão: <nome>-demo.mp4)")
    parser.add_argument(
        "--min-freeze",
        type=float,
        default=DEFAULT_MIN_FREEZE,
        help=f"duração mínima de um trecho parado para cortar (padrão: {DEFAULT_MIN_FREEZE}s)",
    )
    parser.add_argument(
        "--keep",
        type=float,
        default=DEFAULT_KEEP,
        help=f"quanto preservar do começo de cada trecho parado (padrão: {DEFAULT_KEEP}s)",
    )
    parser.add_argument("--threshold", default=DEFAULT_THRESHOLD, help=f"limiar do freezedetect (padrão: {DEFAULT_THRESHOLD})")
    parser.add_argument("--dry-run", action="store_true", help="só relata o que seria cortado")
    parser.add_argument("--report", action="store_true", help="imprime o relatório em JSON")
    parser.add_argument("--force", action="store_true", help="permite escrever dentro de um diretório de captura")
    args = parser.parse_args()

    try:
        require_tool("ffmpeg")
        require_tool("ffprobe")
        video = args.video.resolve()
        if not video.is_file():
            raise DemoCutError(f"Arquivo não encontrado: {video}")

        output = args.output.resolve() if args.output else video.with_name(f"{video.stem}-demo.mp4")
        if output == video:
            raise DemoCutError("A saída não pode ser o próprio arquivo de origem")

        # A evidência mora num diretório com capture.json. O derivado não pode cair ali.
        if (output.parent / "capture.json").exists() and not args.force:
            raise DemoCutError(
                f"{output.parent} é um diretório de captura gerenciado pela skill.\n"
                "Grave o derivado fora dele (ex.: -o /tmp/demo.mp4) para não misturar demo com evidência."
            )

        duration = probe_duration(video)
        freezes = find_freezes(video, args.threshold, args.min_freeze)
        segments = build_segments(duration, freezes, args.keep)
        removed = duration - sum(end - start for start, end in segments)
        output_duration = duration - removed

        report = {
            "source": str(video),
            "sourceSeconds": round(duration, 2),
            "freezesDetected": len(freezes),
            "segments": len(segments),
            "removedSeconds": round(removed, 2),
            "outputSeconds": round(output_duration, 2),
            "compression": f"{removed / duration:.0%}" if duration else "0%",
            "output": str(output),
            "dryRun": args.dry_run,
        }

        if not args.dry_run:
            render(video, output, segments)

        if args.report:
            print(json.dumps(report, indent=2))
        else:
            print(
                f"{report['sourceSeconds']}s → {report['outputSeconds']}s "
                f"(removido {report['removedSeconds']}s / {report['compression']} em {report['freezesDetected']} pausas)"
            )
            if not args.dry_run:
                print(f"demo: {report['output']}")
        return 0
    except (DemoCutError, subprocess.SubprocessError) as error:
        print(f"erro: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
