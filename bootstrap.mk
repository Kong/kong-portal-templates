KONG_PORTAL_TOOLS=https://${GITHUB_TOKEN}@github.com/Kong/kong-portal-tools.git

bootstrap:
	git clone --single-branch --branch chore/upgrade-deps ${KONG_PORTAL_TOOLS}
	cp -a kong-portal-tools/kong-portal-ci/. .
