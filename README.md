# Intelligent Viewing Sample Application (IVSA)

## Setup Requirements

### Intelligent Viewing or Core Viewing and Transformation

IVSA requires a running instance of Intelligent Viewing (IV) or Core Viewing and Transformation Services (CVTS) to work with. IVSA does not provide any viewing or transformation services itself, it only wraps and configures the viewer provided by those services, and utilizes those services to transform source files to make them suitable for viewing. Installing and configuring IV or CVTS is outside the scope of this tutorial. See http://knowledge.opentext.com/ for installation and configuration details.

IVSA requires the Node.js Javascript runtime environment as its host environment. Download the Node.js pre-built installer appropriate for your platform from: https://nodejs.org/en/download/ and install it. The installer should install two command line tools, node and npm. You can confirm these are available on your command line after installation by running the following commands, which will print the version of the installed tool.

```cmd
node -v
npm -v
```

### OTDS Non-Confidential OAUTH client and OTDS User account

Authentication for IVSA requires a non-confidential OAUTH client and a user account in OTDS. The OTDS URL and the OAUTH client name are supplied to IVSA through environment variables. See the [IVSA Environment Variables](#ivsa-environment-variables) section for more detail.

### IVSA file service (if needed)

Navigate to the src/filesvr directory within the root IVSA directory and run _npm install_.
If needed, create a .env file and populate the file with the environment variable values desired for filesvr behavior. See the [filesvr Environment Variables](#filesvr-environment-variables) section for a list of supported environment variables.

```cmd
cd src\filesvr
npm install
```

### IVSA application

Navigate to the root IVSA directory and enter _npm install_ to install the full set of Node.js dependencies, then enter _npm run build_ to build the application into a runnable webapp. If and when you make changes to the source code, you will need to again enter _npm run build_ to apply those changes to the generated files that are actually used while running.

```cmd
npm install
npm run build
```

The application requires a number of environment variables to be set with configuration values telling it where to find the services and how to authenticate. You can either set these manually in your environment, or you can create a .env file in the root directory if the IVSA project and populate the file with the environment variable values required for the target IV/CVT instance. See the [IVSA Environment Variables](#ivsa-environment-variables) for a list of supported environment variables. Also see the [File Storage Plugins](#file-storage-plugins) section for environment variables specific to the file storage plugin to be used.

Example .env file for an Intelligent Viewing instance

```yaml
OTDS_ORIGIN=http://computer.domain.com:8080
OAUTH_CLIENT=iv-sample
PUBLICATION_AUTHORITY=http://computer.domain.com:3356
MARKUP_AUTHORITY=http://computer.domain.com:3352
HIGHLIGHT_AUTHORITY=http://computer.domain.com:3357
VIEWER_AUTHORITY=http://computer.domain.com:3358
# file store
FILESTORE_PLUGIN=filesvr
FILESVR_AUTHORITY=http://computer.domain.com:5001
```

Example .env file for an Intelligent Viewing instance using HTTP URL

```yaml
OTDS_ORIGIN=http://computer.domain.com:8080
OAUTH_CLIENT=iv-sample
PUBLICATION_AUTHORITY=http://computer.domain.com:3356
MARKUP_AUTHORITY=http://computer.domain.com:3352
HIGHLIGHT_AUTHORITY=http://computer.domain.com:3357
VIEWER_AUTHORITY=http://computer.domain.com:3358
# file store
FILESTORE_PLUGIN=httpurl
```

Example .env file for a Core Viewing and Transformation instance using CSS v2

```yaml
OTDS_ORIGIN=https://otdsauth-my-deployment.net
OTDS_AUTHORIZE_PATH=/otdstenant/otds.system/login
OTDS_TOKEN_PATH=/oauth2/token
OAUTH_CLIENT=cvt-sample
PUBLICATION_AUTHORITY=https://publicationservice-my-deployment.net
MARKUP_AUTHORITY=https://markupservice-my-deployment.net
HIGHLIGHT_AUTHORITY=https://highlightservice-my-deployment.net
VIEWER_AUTHORITY=https://viewerservice-my-deployment.net
# file store CSSv2
FILESTORE_PLUGIN=cssv2
CSS_AUTHORITY=https://contentservice-my-deployment.net
```

Example .env file for a Core Viewing and Transformation instance using CSS v3

```yaml
OTDS_ORIGIN=https://otdsauth-my-deployment.net
OTDS_AUTHORIZE_PATH=/otdstenant/otds.system/login
OTDS_TOKEN_PATH=/oauth2/token
OAUTH_CLIENT=cvt-sample
PUBLICATION_AUTHORITY=https://publicationservice-my-deployment.net
MARKUP_AUTHORITY=https://markupservice-my-deployment.net
HIGHLIGHT_AUTHORITY=https://highlightservice-my-deployment.net
VIEWER_AUTHORITY=https://viewerservice-my-deployment.net
# file store CSSv3
FILESTORE_PLUGIN=cssv3
CSS_AUTHORITY=https://contentservice-my-deployment.net
RAS_AUTHORITY=https://ras-my-deployment.net
```

## Authentication - Overview

The IVSA supports the use of either password grant or client credential grant authentication via OTDS. The type of authentication mechanism used is triggered by the existence of the OAUTH_SECRET environment variable. If this environment variable is defined, the client credential grant authentication method is used otherwise the password grant authentication method is used.

The scopes required for the OAUTH client are the same regardless of what authentication method is used.

## Authentication - Client Credential Grant

The IVSA can be authenticated through OTDS using a confidential OAUTH client and secret combination provided to the application through environment variables. In this method the OAUTH_CLIENT environment variable must reference a confidential OAUTH client and the OAUTH_SECRET environment variable must be defined and reference the secret associated with the confidential OAUTH client.

The OAUTH client is also required to have a specific set of scopes assigned in OTDS. The environment-specific scope requirements are detailed below. The OAUTH client can be created manually using the OTDS admin client. See the [Setup in OTDS](#setup-in-otds) section for more details. The OAUTH client name is provided to IVSA using the environment variable OAUTH_CLIENT specified in a .env file in the ivsa base directory.

## Authentication - Password Grant

The IVSA can be authenticated through OTDS with a username and password combination provided by either command line parameters or console prompts when running the application. The --user/-u and --password/-p command line parameters can be used when starting the application. If these command line parameters are not provided, the application will prompt the user to enter the appropriate username and password.

The username and password required are not created out of the box and must be available in OTDS to run the sample application. It is expected that users wanting to use the IVSA will have access to OTDS user accounts that can be used for running the application. See the [Setup in OTDS](#setup-in-otds) section for more details.

The password grant authentication process requires a non-confidential OAUTH client for use when calling the OTDS authorization API. The OAUTH client is also required to have a specific set of scopes assigned in OTDS. The environment specific scope requirements are detailed below. The OAUTH client can be created manually using the OTDS admin client. The OAUTH client name is provided to IVSA using the environment variable OAUTH_CLIENT specified in a .env file in the ivsa base directory.

### OAUTH Client Required Scopes

| Deployment          | Scopes                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Intelligent Viewing | view_publications, create_publications                                                              |
| OT2 with CSS v2     | view_publications, create_publications, readwrite, transform_content, otds:groups                   |
| OT2 with CSS v3     | view_publications, create_publications, readwrite, transform_content, otds:groups, storage.internal |

## Setup in OTDS

**To Create the Confidential OAuth Client for Client Credential Grant:**

1. Open OTDS admin in your browser.
2. Sign in to OTDS using Admin credentials.
3. Select **OAuth Clients** from the SETUP options list.
4. On the **General** page, click **Add**. The **New OAuth client** wizard will guide you through the steps.
5. Type a unique name in the **Client ID** text box.
6. Type a **Description** of this OAuth client.
7. Select **Confidential** to create a confidential client.
8. Click **Next**.
9. On the **User Partition** page, select **Global**, then click **Next**.
10. On the **Advanced** page, **Permissible scopes** area, add **Permissible scopes** and **Default scopes**.
11. Enter the **Access token lifetime** as 1000 seconds.
12. Enter the **Refresh token lifetime** as 20000 seconds.
13. Verify that **Grant refresh token** and **Use session lifetime as refresh token lifetime** are both selected.
14. When finished, click **Save**.
15. A dialog box is shown with the generated client secret.
16. Copy the client secret and save it to be accessed and used in the next step.
17. Configure the .env file to update the OAUTH_SECRET value as the above copied client secret.

**To Allocate Users to a License:**

1. Select **Users & Groups**.
2. Select the recently created OAuth client ID with the same username.
3. From the user's **Actions** menu, click **Allocate to License**.
4. In the **Allocate to License** dialog, do the following:
   1. From the **License** list, select *Viewing - iv*
   2. From the **Counter** list, select *INTELLIGENT_VIEWING.FULLTIME_USERS_REGULAR*
   3. Click **Allocate to License**.

---

**To Create the Non-confidential OAuth Client for Password Grant:**

1. Open OTDS admin in your browser.
2. Sign in to OTDS using Admin credentials.
3. Select **OAuth Clients** from the SETUP options list.
4. On the **General** page, click **Add**. The **New OAuth client** wizard will guide you through the steps.
5. Type a unique name in the **Client ID** text box.
6. Type a **Description** of this OAuth client.
7. Click **Next**.
8. On the **User Partition** page, select **Global**, then click **Next**.
9. On the **Advanced** page, **Permissible scopes** area, add **Permissible scopes** and **Default scopes**.
10. Enter the **Access token lifetime** as 1000 seconds.
11. Enter the **Refresh token lifetime** as 20000 seconds.
12. Verify that **Grant refresh token** and **Use session lifetime as refresh token lifetime** are both selected.
13. When finished, click **Save**.

**To Create a Partition and Add Users:**

1. From the OTDS administration menu, click **Partitions**.
2. Click **Add**, and from the **Add** list, select **New Non-synchronized User Partition**.
3. Provide a name and description, then click **Save**.
4. Select the newly created partition and click **Actions**.
5. From the **Actions** menu, click **View Members**.
6. Click **Add**, and from the **Add** menu, select **New User**.
7. In the **User Name** box, type the **First Name**, **Last Name**, and **Email** for this user.
8. Click **Next** to provide details on the **Account** page.
9. In the **Password Options** area, select **Do not require password change on reset**.
10. To further manage password changes, select **User cannot change password** and **Password never expires**.
11. In the **Initial Password** area, type a **Password** for the new user, then retype this initial password in the **Confirm Password** box.
12. Click **Save**.

**To Allocate Users to a License:**

1. Select **Users & Groups**.
2. Select the recently created username.
3. From the user's **Actions** menu, click **Allocate to License**.
4. In the **Allocate to License** dialog, do the following:
   1. From the **License** list, select *Viewing - iv*
   2. From the **Counter** list, select *INTELLIGENT_VIEWING.FULLTIME_USERS_REGULAR*
   3. Click **Allocate to License**.

## Authentication Token Refresh

The IVSA implements a simple token refresh process based on the specific mechanisms used to authenticate the application and pass the authentication off to the browser user interface. In addition to the authentication token, the browser is provided the expiration timeout for the token. The browser code will calculate a refresh interval based on the token timeout divided by two. When the token needs to be refreshed the browser code will call a REST API method exposed by the IVSA and IVSA will refresh the token and return a new token to the browser.

For the password grant authentication mechanism, IVSA uses the refresh token and issue a refresh_token grant authentication call to OTDS to refresh the original authentication token.

The token returned from OTDS for the client credential grant authentication mechanism does not include a refresh token. For client credential grant scenarios, the IVSA application will re-authenticate the OAUTH client/secret combination defined in the OAUTH_CLIENT and OAUTH_SECRET environment variables.

## IVSA Environment Variables

| Variable              | Value                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUBLICATION_AUTHORITY | The hostname for the IV/CVT Publication service. **Required**. (e.g. "http://computer.domain.com:3356")                                                                                                   |
| MARKUP_AUTHORITY      | The hostname for the IV/CVT Markup service. **Required**. (e.g. "http://computer.domain.com:3352")                                                                                                        |
| HIGHLIGHT_AUTHORITY   | The hostname for the IV/CVT Search/Highlight service. **Required**. (e.g. "http://computer.domain.com:3357")                                                                                              |
| VIEWER_AUTHORITY      | The hostname for the IV/CVT Viewer service. **Required**. (e.g. "http://computer.domain.com:3358")                                                                                                        |
| PORT                  | The port to run the IVSA service on. Defaults to 5000 if not provided.                                                                                                                                    |
| KEYSTORE_PATH         | Local filepath to a keystore file if the IVSA service should run with SSL support.                                                                                                                        |
| KEYSTORE_PASSWORD     | Password to use with the keystore specified in KEYSTORE_PATH if the IVSA service should run with SSL support.                                                                                             |
| OTDS_ORIGIN           | The hostname for the OTDS API. **Required**. (e.g. "http://computer.domain.com:8080")                                                                                                                     |
| OTDS_AUTHORIZE_PATH   | The OTDS API path used for issuing authentication calls. Optional, defaults to /otdsws/login                                                                                                              |
| OTDS_TOKEN_PATH       | The OTDS API path used for issuing token calls such as refreshing an existing authentication token. Optional, defaults to /otdsws/oauth2/token if not provided                                            |
| OAUTH_CLIENT          | The OAUTH client ID used for authentication. This should be a non-confidential client if password grant authentication is used or a confidential client if client credential grant authentication is used |
| OAUTH_SECRET          | The secret associated with the OAUTH client ID if client credential grant authentication is used.                                                                                                         |
| FILESTORE_PLUGIN      | The name of the file store plug-in to use. (See below).                                                                                                                                                   |

## File Storage Plugins

The IVSA project implements a simple plugin pattern for supporting an array of file upload targets. The file storage plugin mechanism provides flexibility for IVSA to work against Intelligent Viewing installation as well as OT2 deployments. Additionally, a developer is free to write their own file storage plugin for use with whatever storage technology is used for their environment. The file storage plugin name is provided to IVSA using the environment variable FILESTORE_PLUGIN. Each file storage plugin may define its own specific environment variables as needed.

### File Storage Plugins provided by IVSA

| Plugin  | Description                                                                                                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| filesvr | An optional, simple Node.js file server for use with off-cloud Intelligent Viewing installations. Requires an additional FILESVR_AUTHORITY environment variable to be set with an appropriate base URL for the running instance of filesvr (e.g. "http://computer.domain.com:5001"). |
| httpurl | A file storage plugin where the original source document which is retrievable via HTTP(S) URL.                                                                                                                                                                                       |
| cssv2   | A file storage plugin for facilitating file uploads to OT2 Content Storage Service (CSS) using the v2 API. Requires the CSS_AUTHORITY environment variable for specifying the URL to the CSS API service endpoint.                                                                   |
| cssv3   | A file storage plugin for facilitating file uploads to OT2 Content Storage Service (CSS) using the v3 API. Requires the CSS_AUTHORITY and RAS_AUTHORITY environment variables for specifying the URLs to the CSS and RAS API service endpoints.                                      |

## filesvr - IVSA simple file storage service

Deployments of Intelligent Viewing do not have an out of the box file storage implementation. That level of functionality is expected to be provided by an integrating application such as a document management system. However, this presents a problem for the IVSA as the application is limited until the integration provider implements its own file storage plugin for IVSA.

To allow the use of IVSA on an Intelligent Viewing installation out of the box, the IVSA code includes a simple file upload/download service that can be used to test the Intelligent Viewing installation without the need for a custom, application specific file service plugin. **_Note that the filesvr code is intended for testing only and is not a production ready file server._**

The filesvr file service code is located in the src/filesvr directory in the ivsa project and can be run separately as a standalone file upload/download service. The filesvr directory contains its own package.json file so running _npm install_ in the filesvr directory is necessary once before the service can be started. The package.json file also contains a set of script definitions that can be used to run the service. For example, to the run the service on a Windows machine, execute the following command sequence.

```cmd
cd src\filesvr
npm run start:windows
```

## filesvr Environment Variables

| Variable          | Value                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| PORT              | The port to run the filesvr service on. Defaults to 5001 if not provided.                                        |
| KEYSTORE_PATH     | Local file path to a keystore file if the filesvr service should run with SSL support.                           |
| KEYSTORE_PASSWORD | Password to use with the keystore specified in KEYSTORE_PATH if the filesvr service should run with SSL support. |

## Command line options

To launch IVSA you can use the ivsa or ivsa.bat script file, for Linux and Windows respectively. To list the available command line options, from a command line prompt in the directory you have placed the IVSA files, execute the following command.

```cmd
ivsa --help
```
