# SIFT CLI

Manage your SIFT Installation

## Usage

```
Usage:
  sift [options] list-upgrades [--pre-release]
  sift [options] install [--pre-release] [--version=<version>] [--mode=<mode>] [--user=<user>]
  sift [options] update
  sift [options] upgrade [--pre-release]
  sift [options] version
  sift -h | --help | -v

Options:
  --dev                 Developer Mode (do not use, dangerous, bypasses checks)
  --version=<version>   Specific version install [default: latest]
  --mode=<mode>         SIFT Install Mode (complete or packages-only) [default: complete]
  --user=<user>         User used for SIFT config [default: ${currentUser}]
  --no-cache            Ignore the cache, always download the release files
```

## Issues

Open issues over at the main [SIFT Repository](https://github.com/sans-dfir/sift/issues), prefix all issues with `[CLI]`

## Installation

1. Go to the [Latest Releases](https://github.com/sans-dfir/sift-cli/releases/latest)
2. Download all the release files
    * sift-cli-linux
    * sift-cli-linux.sha256.asc
3. Import the PGP Key - `gpg --keyserver pgp.mit.edu --recv-keys 22598A94`
4. Validate the signature `gpg --verify sift-cli-linux.sha256.asc`
5. Validate SHA256 signature `sha -a 256 -c sift-cli-linux.sha256.asc`
    * You'll see an error about improperly formatted lines, it
      can be ignored so long as you see `sift-cli-linux: OK` before it
6. Move the file to `mv sift-cli-linux /usr/local/bin/sift`
7. Run `chmod 755 /usr/local/bin/sift`
8. Type `sift --help` to see its usage

## Examples

### Install Latest SIFT

```bash
sift install
```

### Install Latest SIFT (packages only)

```bash
sift install --mode=packages-only
```

### Install Specific Version

```bash
sift install v2017.22.2
```

### Update Existing VM

This just makes sure the current version is up-to-date

```bash
sift update
```

### Upgrading to new SIFT Release

```bash
sift upgrade
```
