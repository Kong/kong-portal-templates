# Kong Developer Portal Templates

Developer Portal Template Files for Kong Enterprise Edition

## Requirements

- [kong-portal-cli](https://github.com/kong/kong-portal-cli)

## Installation

First install the Kong Portal CLI then follow these instructions:

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
  - `themes/`
    - `<theme-name>`
      - `assets/`
      - [`layouts/`](#Layouts)
      - [`partials/`](#Partials)
      - [`theme.conf.yaml`](#Theme-Configuration)
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

### Themes

#### Theme Configuration

Not yet documented.

#### Assets

Not yet documented.

#### Layouts

Layouts contain the HTML for your pages, with some LUA to dynamically manage content, configuration, and user data.

#### Partials

Not yet documented.

## Libraries Used

- [Lua Resty Template](https://handlebarsjs.com/)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)
- [VueJS](https://vuejs.org/)