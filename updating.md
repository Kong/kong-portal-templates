# Updating kong-portal-templates

## Updating all changes in Portal Templates

Get the latest updates from this repo in your portal by merging in changes from the `master` branch, like this:

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

Note: Updating the theme can also be done by merging all the changes from the `master` branch as described above. If you only want to update Kong's Swagger UI theme, you can do it manually like this:

1. Download the new version of `swagger-ui-kong-theme-<HASH>.min.js`:
    - **Raw:** [https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-c0e498a.min.js](https://raw.githubusercontent.com/Kong/kong-portal-templates/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-c0e498a.min.js)
    - **Github:** [https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-c0e498a.min.js](https://github.com/Kong/kong-portal-templates/blob/master/workspaces/default/themes/base/assets/js/swagger-ui-kong-theme-c0e498a.min.js)
2. Place in your workspace at `workspaces/<space>/themes/base/assets/js/swagger-ui-kong-theme-c0e498a.min.js`
3. Open `workspaces/<space>/themes/base/layouts/system/spec-renderer.html` and update the `<script src=""></script>` tag that imports the theme

    ```html
    <script src="assets/js/swagger-ui-kong-theme-c0e498a.min.js"></script>
    ```

4. Delete the old theme file at `workspaces/<space>/themes/base/assets/js/swagger-ui-kong-theme-<OLDHASH>.min.js`
