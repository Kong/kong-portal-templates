KONG_PORTAL_TOOLS=https://${GITHUB_TOKEN}@github.com/Kong/kong-portal-tools.git

bootstrap:
	git clone --single-branch --branch chore/run-against-2.1 ${KONG_PORTAL_TOOLS}
	cp -a kong-portal-tools/kong-portal-ci/. .
