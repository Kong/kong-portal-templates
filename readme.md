# Kong Developer Portal Templates

Developer Portal Template Files for Kong Enterprise Edition

>NOTE: These templates are for use with Kong Developer Portal `v1.3` and above. Please checkout https://github.com/Kong/kong-portal-templates/master-legacy for `v0.36.*` and below.

## Requirements

- [kong-portal-cli](https://github.com/kong/kong-portal-cli)

## Installation

First install the Kong Portal CLI, then follow these instructions:

```bash
$ git clone git@github.com:Kong/kong-portal-templates.git
$ cd kong-portal-templates
$ portal deploy default
```

## Workspaces

Path: `workspaces/<workspace-name>`

Workspaces are a way to segment entities within Kong. Each workspace contains
one portal each with it's own content and themes.

Each Workspace follows the following structure:

- `<workspace-name>/`
  - `content/`
  - [`themes/`](#Themes)
  - [`cli.conf.yaml`](#CLI-Configuration)
  - [`portal.conf.yaml`](#Portal-Configuration)

### CLI Configuration

Path: `workspaces/<workspace-name>/cli.conf.yaml`

Workspace CLI configuration file is used by the Kong Portal CLI tool, see CLI
configuration documentation for more details.

### Portal Configuration

Path: `workspaces/<workspace-name>/portal.conf.yaml`

Workspace specific portal configuration.

Values declared here will take priority over both `theme.conf.yaml` and values
defined in your Kong `kong.conf`.

### Templates Documentation

- [Structure and Filetypes](https://docs.konghq.com/enterprise/1.3-x/developer-portal/structure-and-file-types/)
- [Working with Templates](https://docs.konghq.com/enterprise/1.3-x/developer-portal/working-with-templates/)
- [Portal CLI](https://docs.konghq.com/enterprise/1.3-x/developer-portal/helpers/cli/)

## Libraries Used

- [Lua Resty Template](https://github.com/bungle/lua-resty-template)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)
- [VueJS](https://vuejs.org/)
