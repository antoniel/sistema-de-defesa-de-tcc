#!/bin/bash

# Script para executar testes de segurança
# Uso: ./scripts/run-security-tests.sh [opções]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Este script deve ser executado no diretório raiz do servidor"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    print_warning "Dependências não encontradas. Instalando..."
    npm install
fi

# Função para executar testes específicos
run_security_tests() {
    local test_pattern="$1"
    local description="$2"
    
    print_message "Executando $description..."
    
    if npm test -- --grep "$test_pattern" --reporter=verbose; then
        print_success "$description concluídos com sucesso"
        return 0
    else
        print_error "$description falharam"
        return 1
    fi
}

# Função para executar todos os testes de segurança
run_all_security_tests() {
    print_message "Iniciando execução de todos os testes de segurança..."
    
    local failed_tests=0
    
    # Testes de autenticação
    if ! run_security_tests "Authentication" "Testes de autenticação"; then
        ((failed_tests++))
    fi
    
    # Testes de RBAC
    if ! run_security_tests "Role-Based Access Control" "Testes de controle de acesso baseado em role"; then
        ((failed_tests++))
    fi
    
    # Testes de validação de entrada
    if ! run_security_tests "Input Validation" "Testes de validação de entrada"; then
        ((failed_tests++))
    fi
    
    # Testes de prevenção de ataques
    if ! run_security_tests "SQL Injection" "Testes de prevenção de SQL injection"; then
        ((failed_tests++))
    fi
    
    if ! run_security_tests "XSS" "Testes de prevenção de XSS"; then
        ((failed_tests++))
    fi
    
    # Testes de controle de recursos
    if ! run_security_tests "Resource Access Control" "Testes de controle de recursos"; then
        ((failed_tests++))
    fi
    
    # Relatório final
    if [ $failed_tests -eq 0 ]; then
        print_success "Todos os testes de segurança passaram!"
        return 0
    else
        print_error "$failed_tests conjunto(s) de testes falharam"
        return 1
    fi
}

# Função para executar testes com cobertura
run_security_tests_with_coverage() {
    print_message "Executando testes de segurança com cobertura..."
    
    if npm test -- --grep "Security" --coverage --reporter=verbose; then
        print_success "Testes de segurança com cobertura concluídos"
        return 0
    else
        print_error "Testes de segurança com cobertura falharam"
        return 1
    fi
}

# Função para executar testes em modo watch
run_security_tests_watch() {
    print_message "Executando testes de segurança em modo watch..."
    print_warning "Pressione Ctrl+C para parar"
    
    npm test -- --grep "Security" --watch
}

# Função para mostrar ajuda
show_help() {
    echo "Uso: $0 [OPÇÃO]"
    echo ""
    echo "Opções:"
    echo "  all                    Executar todos os testes de segurança"
    echo "  auth                   Executar apenas testes de autenticação"
    echo "  rbac                   Executar apenas testes de RBAC"
    echo "  validation             Executar apenas testes de validação"
    echo "  attacks                Executar apenas testes de prevenção de ataques"
    echo "  resources              Executar apenas testes de controle de recursos"
    echo "  coverage               Executar testes com cobertura"
    echo "  watch                  Executar testes em modo watch"
    echo "  help                   Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 all                 # Executar todos os testes"
    echo "  $0 auth                # Executar apenas testes de autenticação"
    echo "  $0 coverage            # Executar com cobertura"
}

# Verificar argumentos
case "${1:-all}" in
    "all")
        run_all_security_tests
        ;;
    "auth")
        run_security_tests "Authentication" "Testes de autenticação"
        ;;
    "rbac")
        run_security_tests "Role-Based Access Control" "Testes de RBAC"
        ;;
    "validation")
        run_security_tests "Input Validation" "Testes de validação"
        ;;
    "attacks")
        run_security_tests "SQL Injection|XSS" "Testes de prevenção de ataques"
        ;;
    "resources")
        run_security_tests "Resource Access Control" "Testes de controle de recursos"
        ;;
    "coverage")
        run_security_tests_with_coverage
        ;;
    "watch")
        run_security_tests_watch
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Opção inválida: $1"
        show_help
        exit 1
        ;;
esac

exit $?