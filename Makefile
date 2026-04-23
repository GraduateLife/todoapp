.PHONY: help install dev build preview vercel-link vercel-env vercel-deploy vercel-deploy-prod

VERCEL ?= pnpm dlx vercel
WORKER_URL ?=

help:
	@printf "\nFrontend / Vercel commands\n\n"
	@printf "  make install             Install root dependencies\n"
	@printf "  make dev                 Start local frontend dev server\n"
	@printf "  make build               Build frontend locally\n"
	@printf "  make preview             Preview frontend build locally\n"
	@printf "  make vercel-link         Link this repo to a Vercel project\n"
	@printf "  make vercel-env          Add VITE_API_BASE_URL to Vercel envs\n"
	@printf "  make vercel-deploy       Create a preview deployment\n"
	@printf "  make vercel-deploy-prod  Create a production deployment\n"
	@printf "\nExamples\n\n"
	@printf "  make vercel-env WORKER_URL=https://todoapp-share.<subdomain>.workers.dev\n"
	@printf "  make vercel-deploy-prod\n\n"

install:
	pnpm install --registry=https://registry.npmjs.org

dev:
	pnpm dev

build:
	pnpm build

preview:
	pnpm preview

vercel-link:
	$(VERCEL)

vercel-env:
	@if [ -z "$(WORKER_URL)" ]; then \
		printf "WORKER_URL is required.\nExample:\n  make vercel-env WORKER_URL=https://todoapp-share.<subdomain>.workers.dev\n"; \
		exit 1; \
	fi
	printf "%s\n" "$(WORKER_URL)" | $(VERCEL) env add VITE_API_BASE_URL production
	printf "%s\n" "$(WORKER_URL)" | $(VERCEL) env add VITE_API_BASE_URL preview
	printf "%s\n" "$(WORKER_URL)" | $(VERCEL) env add VITE_API_BASE_URL development

vercel-deploy:
	$(VERCEL)

vercel-deploy-prod:
	$(VERCEL) --prod
