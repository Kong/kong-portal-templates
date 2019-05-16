# Kong Developer Portal Templates

Developer Portal Template Files for Kong Enterprise Edition

## Client-side Libraries Used

- [Handlebars](https://handlebarsjs.com/)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)
- [VueJS](https://vuejs.org/)

## Requirements

- [NodeJS (v9.8.0)](https://nodejs.org/en/blog/release/v9.8.0/)
- [NPM (5.6.0)](https://www.npmjs.com/package/npm/v/5.6.0)

## Installation

```bash
$ git clone git@github.com:Kong/kong-portal-templates.git
$ npm install
```

## Directory Structure
- `bin/` - CLI helpers / tooling
  - `sync.js` - Script to create, and update theme files in the Kong File API
- `themes/` - Portal themes
  - `default/` - Default Developer Portal Theme files
    - `pages/` - Handlebars pages served by the dev portal
    - `partials/` - Handlebars partials, referenced by pages
    - `specs/` - Directory of OAS specifications for use by portal
  - `default-ie11/` - Default IE11 Compliant Developer Portal Theme files
    - `pages/` - Handlebars pages served by the dev portal
    - `partials/` - Handlebars partials, referenced by pages
    - `specs/` - Directory of OAS specifications for use by portal

## Environment Variables

|Variable|Default|Description|
|---|---|---|
|`KA_API_URL`|`http://127.0.0.1:8001`|Kong Admin API URL|
|`KA_RBAC_TOKEN`|N/A|Sets `kong-admin-token` header on file requests|
|`WORKSPACE`|`default`|Workspace in which to sync files with (`WORKSPACE=default` will sync files with `ADMIN_API_URL/default/files`)
|`DIRECTORY`|`./themes/default`|Directory the sync script will scan and watch for changes.|
|`PUSH`|`false`|`true` pushes files to workspaced Files API (compare to `git push --force`)|
|`PULL`|`false`|`true` pulls files from workspaced Files API (compare to `git pull`)|
|`DELETE_ALL`|`false`|`true` removes all files from workspaced Files API. USE WITH CAUTION!!!|
|`NO_PROMPT`|`false`|`true` skip console prompt when making destructive actions. USE WITH CAUTION!!!|
|`INTERVAL`|`5`|Sync script watch interval in seconds|
|`TYPE`|N/A|Type of files the sync script is scanning. By default, the files are assumed to be directory based `<type>/<filename>`.  (it is generally recommended to stay with the directory based folder structure found in `default/`)|
|`EMOJI`|`false`|`true` enables emoji status symbol output in the sync script.|

### Example Usage


#### Push files to a specific workspaces dev portal
- call script directly
  ```bash
  $ WORKSPACE=custom_workspace PUSH=true node bin/sync
  ```
- npm command
  ```bash
  $ WORKSPACE=custom_workspace npm run watch
  ```

#### Push/Pull to Kong Files API
- call script directly
  ```bash
  $ PUSH=true node bin/sync
  $ PULL=true node bin/sync
  ```
- npm command
  ```bash
  $ npm run push
  $ npm run pull
  ```

#### Delete all files from files API
- call script directly
  ```bash
  $ DELETE_ALL=true node bin/sync
  ```
- npm command
  ```bash
  $ npm run wipe
  ```

#### Use Emoji's:
```bash
$ EMOJI=true WATCH=true node bin/sync
```
