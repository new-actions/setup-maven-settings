# Setup Maven Settings

*Simplified setup of the `settings.xml` configuration file for a Maven project.*

Maven makes it easy to download packages that are hosted on Maven Central. Unknown to many, Maven is fully decentralized though and additional repositories can be added in a `pom.xml` file. This makes it possible for library maintainers to publish their packages in convenient package registries, for example, the one available through GitHub.

Unfortunately, downloading packages from these decentralized registries is usually not possible without authentication. It is necessary to provide the *id*, the *url*, and a *password*/*token* of said registry in a `settings.xml` file (examples can be found later).

While it is conceptually easy to create such a `settings.xml` in a build workflow by yourself, it is error-prone and introduces unnecessary complexity to the build configuration. The better solution is to use this GitHub action, which has convenient configuration options to create the file.

Main features:

- Makes it easy to configure the creation of a `settings.xml` file.
- Introduces a short-hand syntax for server entries that point to GitHub package registries, to shorten the workflow definition and avoid duplication.
- Can be used alongside other plugins that write to the `settings.xml` file. New configration options get integrated, should the file already exist.
- Works both on Linux and Windows builds.
- Meaningful error messages make it easy to spot misconfiguration.

The current version is limited to the creation of *servers*. More settings will be added when the need arises.

## Options

The action has the following configuration options, all are optional.

|Key|Description|Default Value|
|---|---|---|
|`path`|Path to `settings.xml` file (always use `/` as delimiter)| `~/.m2/settings.xml` |
|`servers`|Array of detailed &lt;server information&gt; | `[]` |
|`serversGH`|Array of server &lt;ids&gt; for GitHub registries | `[]` |


**Note:** The action will automatically resolve the home directory (`~`) and use the correct folder delimiter on Windows, as long as `/` is used in defined paths. 

## Usage

Three basic steps are required to use additional Maven registries in a build.

#### 1) Add registry to the `pom.xml`

First, the additional registry needs to be added to the `pom.xml` of the Maven project. Let's assume the following configuration exists:

```xml
    <pom>
    	...
    	<registries>
    		<registry>
    			<id>SOME_ID</id>
    			<url>https://...</url>
    		</registry>
    	</registries>
    </pom>
```

#### 2) Configure registry credentials in the GitHub Workflow

The registry needs to be defined in the `settings.xml` with a *username* and *password*/*token*, which can be achieved in two different ways: 

###### a) Full server definition

Servers can be conveniently defined as a JSON array. *Passwords* should not be included in the workflow though, but should be passed as an environment variable instead.

*Workflow definition:*

```yaml
    - uses: new-actions/setup-maven-actions@v0.0.1
      with:
        servers: >
          [
            { "id": "SOME_ID", "username": "u", "password": "${env.KEY}" }
          ]
```

*Generated `settings.xml`:*

```xml
    <settings>
    	<servers>
    		<server>
    			<id>SOME_ID</id>
    			<username>u</username>
    			<password>${env.KEY}</password>
     		</server>
	   	</servers>
    </settings>
```

###### b) Shorthand syntax for GitHub registries

Many projects will use the GitHub package registry as a convenient way to host their Maven packages. The action provides a shorthand syntax to make it as easy as possible to add these servers. This is especially handy, when more than one registry should be added, which would normally result in a huge, redundant blob.

Obviously, GitHub package repositories could also be added like any other server as illustrated in the previous section

*Workflow definition:*

```yaml
    - uses: new-actions/setup-maven-actions@v0.0.1
      with:
        serversGH: >
          [ "SOME_ID" ]
```

*Generated `settings.xml`:*

```xml
    <settings>
    	<servers>
    		<server>
    			<id>SOME_ID</id>
    			<username>${{github.actor}}</username>
    			<password>${env.GITHUB_TOKEN}</password>
    		</server>
    	</servers>
    </settings>
```

#### 3) Pass password/token as environment variable

Every step that uses Maven, needs to pass the *password*/*token* as an environment variable.

```yaml
    - run: mvn clean package
      env:
        KEY: ${{ secrets.SOME_SECRET }} # for example 2a)
        GITHUB_TOKEN: ${{ github.token }} # for example 2b)
```

#### 4) Use alternate path for `settings.xml`

It is also possible to specify an alternate path for the `settings.xml` file.

```yaml
    - uses: new-actions/setup-maven-actions@v0.0.1
      with:
      	path: ${{github.workspace}}/settings.xml
        ...
```

This path then needs to be provided for every invocation of Maven:

```yaml
    	- run: mvn clean package -s ${{github.workspace}}/settings.xml
```




