# SIFT CLI

Manage your SIFT Installation

## Usage

```
Usage:
  sift [options] list-upgrades [--pre-release]
  sift [options] install [--pre-release] <version>
  sift [options] update
  sift [options] upgrade [--pre-release]
  sift -h | --help | --version

Options:
  --dev            Developer Mode (do not use, dangerous, bypasses checks)
  --pre-release    Include any GitHub releases marked as Pre-Release
```

## Installation

1. Go to the [Latest Releases](https://github.com/sans-dfir/sift-cli/releases/latest)
2. Download all the release files
    * sift-cli-linux
    * sift-cli-linux.sha256.asc
3. Validate the signature `gpg --verify sift-cli-linux.sha256.asc`
4. Validate SHA256 signature `sha -a 256 -c sift-cli-linux.sha256.asc`
    * You'll see an error about improperly formatted lines, it
      can be ignored so long as you see `sift-cli-linux: OK` before it

## Examples

### Install Specific Version

`sift install v2017.22.2`

### Update Existing VM

This just makes sure the current version is up-to-date

`sift update`

### Upgrading to new SIFT Release

`sift upgrade`

## Issues

Open issues over at the main [SIFT Repository](https://github.com/sans-dfir/sift/issues), prefix all issues with `[CLI]`
