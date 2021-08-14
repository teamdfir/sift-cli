![Logo](https://images.contentstack.io/v3/assets/blt36c2e63521272fdc/blt3e371eacc79a3ca4/60a5393fe2db156d00f0b8ab/400x460_DFIR_SIFT.jpg)

# SIFT CLI

Manage your SIFT Installation

## Usage

```text
Usage:
  sift [options] list-upgrades [--pre-release]
  sift [options] install [--pre-release] [--version=<version>] [--mode=<mode>] [--user=<user>]
  sift [options] update [--mode=<mode>]
  sift [options] upgrade [--pre-release] [--mode=<mode>]
  sift [options] self-upgrade [--pre-release]
  sift [options] version
  sift [options] debug
  sift -h | --help | -v

Options:
  --dev                 Developer Mode (do not use, dangerous, bypasses checks)
  --version=<version>   Specific version install [default: latest]
  --mode=<mode>         SIFT Install Mode (desktop, server, complete (legacy) or packages-only (legacy)) [default: desktop]
  --user=<user>         User used for SIFT config [default: ${currentUser}]
  --no-cache            Ignore the cache, always download the release files
  --verbose             Display verbose logging
```

## Issues

Open issues over at the main [SIFT Repository](https://github.com/sans-dfir/sift/issues), prefix all issues with `[CLI]`

## Installation

1. Go to the [Latest Releases](https://github.com/sans-dfir/sift-cli/releases/latest)
2. Download all the release files
    * sift-cli-linux
    * sift-cli-linux.sha256.asc
3. Import the PGP Key - `gpg --keyserver hkp://pgp.mit.edu:80 --recv-keys 22598A94`
4. Validate the signature `gpg --verify sift-cli-linux.sha256.asc`
5. Validate SHA256 signature `shasum -a 256 -c sift-cli-linux.sha256.asc` OR `sha256sum -c sift-cli-linux.sha256.asc`
    * Note: You'll see an error about improperly formatted lines, it
      can be ignored so long as you see `sift-cli-linux: OK` before it
6. Move the file to `sudo mv sift-cli-linux /usr/local/bin/sift`
7. Run `chmod 755 /usr/local/bin/sift`
8. Type `sift --help` to see its usage

## Examples

### Install Latest SIFT

```bash
sift install
```

### Install Latest SIFT in Server Mode

**Note:** Server mode only installs tools and packages, it does not do any modifications that would normally appear on the desktop.

```bash
sift install --mode=server
```

### Install Specific Version

```bash
sift install v2019.11.0
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
