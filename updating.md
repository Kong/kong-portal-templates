# Updating kong-portal-templates

## Updating all changes in Portal Templates

Apply the latest updates to your `default` workspace by merging in changes from the `master` branch.

> Note: This will only update the `default` workspace. For updating other workspaces, you must integrate changes manually. See the section "Manually updating swagger-ui-kong-theme" below for how to do this for the swagger-ui-kong-theme.

1. Ensure that you are a tracking Kong's remote repo with `git remote -v`
    - Look for the remote that is tracking Kong's remote repo, in this case it is named `kong`

        ```bash
        git remote -v | grep 'Kong/kong-portal-templates'
        # kong  git@github.com:Kong/kong-portal-templates.git (fetch)
        # kong  git@github.com:Kong/kong-portal-templates.git (push)
        ```

    - If you don't have any output above, add Kong's remote

        ```bash
        git remote add kong git@github.com:Kong/kong-portal-templates.git
        ```

2. Create a local branch called `kong-master` that tracks Kong's remote `master` branch
    - Create new branch `kong-master`

        ```bash
        git fetch kong master:kong-master
        ```

    - Note: if you have already done the above for a past update, you can instead get the latest updates:

        ```bash
        git checkout kong-master
        git pull
        ```

3. Merge `kong-master` into your local development branch

    ```bash
    git checkout <your_development_branch>
    git merge kong-master
    # Address any merge conflicts and complete the merge
    ```

## Manually updating swagger-ui-kong-theme

> Note: Updating the theme for the `default` workspace can also be done by merging all the changes from the `master` branch as described above. If you only want to update Kong's Swagger UI theme, you can do it manually like this:

1. Download the new version of `swagger-ui-kong-theme-<HASH>.min.js`:
    - **Raw:** [https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-180e210.min.js](https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-180e210.min.js)
    - **Github:** [https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-180e210.min.js](https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-180e210.min.js)
2. Place in your workspace at `workspaces/<space>/themes/base/assets/js/swagger-ui-kong-theme-180e210.min.js`
3. Open `workspaces/<space>/themes/base/layouts/system/spec-renderer.html` and update the `<script src=""></script>` tag that imports the theme

    ```html
    <script src="assets/js/swagger-ui-kong-theme-180e210.min.js"></script>
    ```

4. Delete the old theme file at `workspaces/<space>/themes/base/assets/js/swagger-ui-kong-theme-<OLDHASH>.min.js`

## Manually updating swagger-ui-bundle (swagger UI version)

> Note: Updating the theme for the `default` workspace can also be done by merging all the changes from the `master` branch as described above. If you only want to update Kong's Swagger UI bundle (swagger UI version), you can do it manually like this:

1. Download the new version of `swagger-ui-bundle-<SWAGGER-UI-VERSION>.min.js`:
    - **Raw:** [https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/third-party/swagger-ui-bundle-3.26.0.min.js](https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/third-party/swagger-ui-bundle-3.26.0.min.js)
    - **Github:** [https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/third-party/swagger-ui-bundle-3.26.0.min.js](https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/third-party/swagger-ui-bundle-3.26.0.min.js)
2. Place in your workspace at `workspaces/<space>/themes/base/assets/js/third-party/swagger-ui-bundle-3.26.0.min.js`
3. Open `workspaces/<space>/themes/base/layouts/system/spec-renderer.html` and update the `<script src=""></script>` tag that imports the swagger ui bundle

    ```html
    <script src="assets/js/third-party/swagger-ui-bundle-3.26.0.min.js"></script>
    ```

4. (If Applicable) Delete any swagger ui bundle script tags in `workspaces/<space>/themes/base/layouts/system/spec-renderer.html` that do not include `<SWAGGER-UI-VERSION>` in the bundled file name. Older versions of the templates do not include the version in the file name and should be replaced by the tag from step #3 above. Example of old swagger ui bundle script tag to delete:

    ```html
    <!-- Delete this tag if found -->
    <script src="assets/js/third-party/swagger-ui-bundle.min.js"></script>
    ```

5. Delete the old swagger ui bundle file at `workspaces/<space>/themes/base/assets/js/third-party/swagger-ui-bundle-<OLD-SWAGGER-UI-VERSION>.min.js` or `workspaces/<space>/themes/base/assets/js/third-party/swagger-ui-bundle.min.js` for older templates that did not include the swagger ui bundle version in the file name.
