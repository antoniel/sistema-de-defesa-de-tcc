#!/bin/bash

# Visual Testing Helper Script
# Usage: ./scripts/visual-testing.sh [command]
# Commands: init, test, update, compare, clean

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}🎯 Visual Regression Testing${NC}"
    echo "=================================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    print_error "Please run this script from the repository root"
    exit 1
fi

# Change to web app directory
cd apps/web

case "${1:-test}" in
    "init")
        print_header
        print_info "Initializing visual testing setup..."
        
        # Create directories
        mkdir -p test-results/{baseline,current,diff,reports}
        
        # Check if Playwright is installed
        if ! npx playwright --version >/dev/null 2>&1; then
            print_info "Installing Playwright..."
            npm install
            npx playwright install chromium
            npx playwright install-deps
        fi
        
        print_success "Visual testing initialized!"
        print_info "Next steps:"
        echo "  1. Run './scripts/visual-testing.sh update' to create baseline screenshots"
        echo "  2. Run './scripts/visual-testing.sh test' to run visual tests"
        ;;
        
    "test")
        print_header
        print_info "Running visual regression tests..."
        
        # Ensure services are running
        if ! nc -z localhost 5432 2>/dev/null; then
            print_info "Starting database..."
            cd ../..
            npm run docker:up
            sleep 5
            npm run migration:run
            npm run seed
            cd apps/web
        fi
        
        # Run visual tests
        npm run test:visual
        
        # Generate report
        print_info "Generating visual diff report..."
        npm run test:visual:report
        
        # Check results
        if [ -f "test-results/reports/visual-regression-report.html" ]; then
            print_success "Visual regression report generated!"
            print_info "Open test-results/reports/visual-regression-report.html to view results"
            
            # Count differences
            DIFF_COUNT=$(find test-results/diff -name "*.png" 2>/dev/null | wc -l || echo "0")
            if [ "$DIFF_COUNT" -gt 0 ]; then
                print_warning "$DIFF_COUNT visual differences detected"
                echo "Review the report and run './scripts/visual-testing.sh update' if changes are intentional"
                exit 1
            else
                print_success "All visual tests passed!"
            fi
        else
            print_warning "No report generated - might be first run"
            print_info "Run './scripts/visual-testing.sh update' to create baseline screenshots"
        fi
        ;;
        
    "update")
        print_header
        print_info "Updating visual baselines..."
        
        # Ensure services are running
        if ! nc -z localhost 5432 2>/dev/null; then
            print_info "Starting database..."
            cd ../..
            npm run docker:up
            sleep 5
            npm run migration:run
            npm run seed
            cd apps/web
        fi
        
        # Update baselines
        npm run test:visual:update
        
        # Count new baselines
        BASELINE_COUNT=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l || echo "0")
        print_success "Updated $BASELINE_COUNT baseline screenshots"
        
        print_info "Baseline screenshots updated in test-results/screenshots/"
        print_warning "Don't forget to commit these changes to git!"
        ;;
        
    "compare")
        print_header
        print_info "Comparing current screenshots with baselines..."
        
        if [ ! -d "test-results/screenshots" ] || [ -z "$(ls -A test-results/screenshots 2>/dev/null)" ]; then
            print_error "No screenshots found. Run tests first."
            exit 1
        fi
        
        npm run test:visual:report
        
        if [ -f "test-results/reports/visual-regression-report.html" ]; then
            print_success "Comparison report generated!"
            print_info "Open test-results/reports/visual-regression-report.html to view results"
        fi
        ;;
        
    "clean")
        print_header
        print_info "Cleaning visual test artifacts..."
        
        rm -rf test-results/
        rm -rf playwright-report/
        
        print_success "Visual test artifacts cleaned!"
        ;;
        
    "help"|"--help"|"-h")
        print_header
        echo ""
        echo "Usage: ./scripts/visual-testing.sh [command]"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize visual testing setup"
        echo "  test     - Run visual regression tests and generate report"
        echo "  update   - Update baseline screenshots"
        echo "  compare  - Generate comparison report from existing screenshots"
        echo "  clean    - Clean all visual test artifacts"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./scripts/visual-testing.sh init"
        echo "  ./scripts/visual-testing.sh test"
        echo "  ./scripts/visual-testing.sh update"
        echo ""
        ;;
        
    *)
        print_error "Unknown command: $1"
        echo "Run './scripts/visual-testing.sh help' for usage information"
        exit 1
        ;;
esac