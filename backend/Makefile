.PHONY: help install dev deploy login d1-create d1-list secret-cors whoami

WRANGLER ?= pnpm exec wrangler
CORS_ORIGIN ?=

help:
	@printf "\nBackend / Cloudflare Worker commands\n\n"
	@printf "  make install       Install backend dependencies\n"
	@printf "  make login         Log into Cloudflare Wrangler\n"
	@printf "  make whoami        Show current Wrangler account\n"
	@printf "  make d1-create     Create the D1 database for share data\n"
	@printf "  make d1-list       List D1 databases\n"
	@printf "  make secret-cors   Set Worker CORS_ORIGIN secret\n"
	@printf "  make dev           Start local Wrangler dev server\n"
	@printf "  make deploy        Deploy the Worker\n"
	@printf "\nExamples\n\n"
	@printf "  make secret-cors CORS_ORIGIN='https://app.example.com,https://*.vercel.app,http://localhost:3000'\n"
	@printf "  make deploy\n\n"

install:
	pnpm install

login:
	$(WRANGLER) login

whoami:
	$(WRANGLER) whoami

d1-create:
	$(WRANGLER) d1 create todoapp-share

d1-list:
	$(WRANGLER) d1 list

secret-cors:
	@if [ -z "$(CORS_ORIGIN)" ]; then \
		printf "CORS_ORIGIN is required.\nExample:\n  make secret-cors CORS_ORIGIN='https://app.example.com,https://*.vercel.app,http://localhost:3000'\n"; \
		exit 1; \
	fi
	printf "%s\n" "$(CORS_ORIGIN)" | $(WRANGLER) secret put CORS_ORIGIN

dev:
	pnpm cf:dev

deploy:
	pnpm cf:deploy
