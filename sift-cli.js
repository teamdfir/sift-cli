const cfg = require('./config.json')
const bluebird = require('bluebird')
const os = require('os')
const fs = bluebird.promisifyAll(require('fs'))
const child_process = bluebird.promisifyAll(require('child_process'))
const crypto = require('crypto')
const spawn = require('child_process').spawn
const docopt = require('docopt').docopt
const { Octokit } = require('@octokit/rest')
const mkdirp = require('mkdirp')
const request = require('request')
const openpgp = require('openpgp')
const username = require('username')
const readline = require('readline')
const split = require('split')
const semver = require('semver')

/**
 * Setup Custom YAML Parsing
 */
const yaml = require('js-yaml')
const PythonUnicodeType = new yaml.Type('tag:yaml.org,2002:python/unicode', {
  kind: 'scalar',
  construct: (data) => { return data !== null ? data : ''; }
})
const PYTHON_SCHEMA = new yaml.Schema({
  include: [yaml.DEFAULT_SAFE_SCHEMA],
  explicit: [PythonUnicodeType]
})

const currentUser = process.env.SUDO_USER || username.sync()

const doc = `
Usage:
  sift [options] list-upgrades [--pre-release]
  sift [options] install [--pre-release] [--version=<version>] [--mode=<mode>] [--user=<user>]
  sift [options] update
  sift [options] upgrade [--pre-release] [--mode=<mode>] [--user=<user>]
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
`

const saltstackVersion = '3001'
const pubKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: GPGTools - http://gpgtools.org

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
xUlS5QCeIuCyDm3icTtEq3/j6MpEjUkrMJk=
=QmII
-----END PGP PUBLIC KEY BLOCK-----
`

const help = `

----- PLEASE READ ----------------------

A lot of failures are caused by the apt system being locked
or unhealthy. 

Before opening an issue in GitHub, please check to see if 
your apt system is healthy.

Try running 'apt-get update' then remove any packages that 
aren't used by running 'apt-get autoremove'
`

let osVersion = null
let osCodename = null
let cachePath = '/var/cache/sift/cli'
let versionFile = '/etc/sift-version'
let configFile = '/etc/sift-config'
let releaseFile = '/etc/os-release'
let siftConfiguration = {}

const cli = docopt(doc)

const github = new Octokit({
  version: '3.0.0',
  validateCache: true,
})

const error = (err) => {
  console.log('')
  console.log(err.message)
  console.log(err.stack)
  console.log(help)
  process.exit(1)
}

const setup = async () => {
  if (cli['--dev'] === true) {
    cachePath = '/tmp/var/cache/sift'
    versionFile = '/tmp/sift-version'
    configFile = '/tmp/sift-config'
    releaseFile = '/tmp/os-release'
  }

  await mkdirp(cachePath)
}

const validOS = async () => {
  try {
    const contents = fs.readFileSync(releaseFile, 'utf8')

    if (contents.indexOf('UBUNTU_CODENAME=xenial') !== -1) {
      osVersion = '16.04'
      osCodename = 'xenial'
      return true
    }

    if (contents.indexOf('UBUNTU_CODENAME=bionic') !== -1) {
      osVersion = '18.04'
      osCodename = 'bionic'
      return true
    }

    if (contents.indexOf('UBUNTU_CODENAME=focal') !== -1) {
      osVersion = '20.04'
      osCodename = 'focal'
      return true
    }

    throw new Error('invalid OS, unable to determine ubuntu version')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error(`invalid OS, missing ${releaseFile}`)
    }

    throw err
  }
}

const checkOptions = () => {
  const validModes = ['desktop', 'server', 'complete', 'packages-only']

  if (validModes.indexOf(cli['--mode']) === -1) {
    throw new Error(`${cli['--mode']} is not a valid install mode. Valid Modes: ${validModes.join(', ')}`)
  }
}

const fileExists = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false)
      }

      if (err) {
        return reject(err)
      }

      return resolve(true)
    })
  })
}

const saltCheckVersion = (path, value) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, contents) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false);
      }

      if (err) {
        return reject(err);
      }

      if (contents.indexOf(value) === 0) {
        return resolve(true);
      }

      return resolve(false);
    })
  })
}

const setupSalt = async () => {
  if (cli['--dev'] === false) {
    const aptSourceList = '/etc/apt/sources.list.d/saltstack.list'
    const aptDebString = `deb [arch=amd64] http://repo.saltstack.com/py3/ubuntu/${osVersion}/amd64/${saltstackVersion} ${osCodename} main`

    const aptExists = await fileExists(aptSourceList)
    const saltExists = await fileExists('/usr/bin/salt-call')
    const saltVersionOk = await saltCheckVersion(aptSourceList, aptDebString)

    if (aptExists === true && saltVersionOk === false) {
      console.log('NOTICE: Fixing incorrect Saltstack version configuration.')
      console.log('Installing and configuring Saltstack properly ...')
      await child_process.execAsync('apt-get remove -y --allow-change-held-packages salt-common')
      await fs.writeFileAsync(aptSourceList, `deb [arch=amd64] http://repo.saltstack.com/py3/ubuntu/${osVersion}/amd64/${saltstackVersion} ${osCodename} main`)
      await child_process.execAsync(`wget -O - https://repo.saltstack.com/py3/ubuntu/${osVersion}/amd64/${saltstackVersion}/SALTSTACK-GPG-KEY.pub | apt-key add -`)
      await child_process.execAsync('apt-get update')
      await child_process.execAsync('apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y --allow-change-held-packages salt-common', {
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
        },
      })
    } else if (aptExists === false || saltExists === false) {
      console.log('Installing and configuring SaltStack properly ...')
      await fs.writeFileAsync(aptSourceList, `deb [arch=amd64] http://repo.saltstack.com/py3/ubuntu/${osVersion}/amd64/${saltstackVersion} ${osCodename} main`)
      await child_process.execAsync(`wget -O - https://repo.saltstack.com/py3/ubuntu/${osVersion}/amd64/${saltstackVersion}/SALTSTACK-GPG-KEY.pub | apt-key add -`)
      await child_process.execAsync('apt-get update')
      await child_process.execAsync('apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y --allow-change-held-packages salt-common', {
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
        },
      })
    }
  } else {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}

const getCurrentVersion = () => {
  return fs.readFileAsync(versionFile)
    .catch((err) => {
      if (err.code === 'ENOENT') return 'notinstalled'
      if (err) throw err
    })
    .then(contents => contents.toString().replace(/\n/g, ''))
}

const listReleases = () => {
  return github.repos.listReleases({
    owner: 'teamdfir',
    repo: 'sift-saltstack'
  })
}

const getValidReleases = async () => {
  const currentRelease = await getCurrentVersion()
  let releases = await listReleases()
  const realReleases = releases.data.filter(release => !Boolean(release.prerelease)).map(release => release.tag_name)
  const allReleases = releases.data.map(release => release.tag_name)

  if (currentRelease === 'notinstalled') {
    if (cli['--pre-release'] === true) {
      return allReleases
    }
    return realReleases
  }

  let curIndex = allReleases.indexOf(currentRelease)
  if (curIndex === 0) {
    return [allReleases[0]]
  }

  if (cli['--pre-release'] === true) {
    return allReleases.slice(0, curIndex)
  }

  return allReleases.slice(0, curIndex).filter((release) => {
    return realReleases.indexOf(release) !== -1
  })
}

const getLatestRelease = () => {
  return getValidReleases().then(releases => releases[0])
}

const isValidRelease = (version) => {
  return getValidReleases().then((releases) => {
    return new Promise((resolve, reject) => {
      if (releases.indexOf(version) === -1) {
        return resolve(false)
      }
      resolve(true)
    })
  })
}

const validateVersion = (version) => {
  return getValidReleases().then((releases) => {
    if (typeof releases.indexOf(version) === -1) {
      throw new Error('The version you are wanting to install/upgrade to is not valid')
    }
    return new Promise((resolve) => { resolve() })
  })
}

const downloadReleaseFile = (version, filename) => {
  console.log(`>> downloading ${filename}`)

  const filepath = `${cachePath}/${version}/${filename}`

  if (fs.existsSync(filepath) && cli['--no-cache'] === false) {
    return new Promise((resolve) => { resolve() })
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/teamdfir/sift-saltstack/releases/download/${version}/${filename}`)
    req.on('error', (err) => {
      reject(err)
    })
    req
      .on('response', (res) => {
        if (res.statusCode !== 200) {
          throw new Error(res.body)
        }
      })
      .pipe(output)
      .on('error', (err) => {
        reject(err)
      })
      .on('close', resolve)
  })
}

const downloadRelease = (version) => {
  console.log(`>> downloading sift-saltstack-${version}.tar.gz`)

  const filepath = `${cachePath}/${version}/sift-saltstack-${version}.tar.gz`

  if (fs.existsSync(filepath) && cli['--no-cache'] === false) {
    return new Promise((resolve, reject) => { resolve() })
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/teamdfir/sift-saltstack/archive/${version}.tar.gz`)
    req.on('error', (err) => {
      reject(err)
    })
    req
      .pipe(output)
      .on('error', (err) => {
        reject(err)
      })
      .on('close', resolve)
  })
}

const validateFile = async (version, filename) => {
  console.log(`> validating file ${filename}`)
  const expected = await fs.readFileAsync(`${cachePath}/${version}/${filename}.sha256`)

  const actual = await new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256')
    fs.createReadStream(`${cachePath}/${version}/${filename}`)
      .on('error', (err) => {
        reject(err)
      })
      .on('data', (data) => {
        shasum.update(data)
      })
      .on('close', () => {
        resolve(`${shasum.digest('hex')}  /tmp/${filename}\n`)
      })
  })

  if (expected.toString() !== actual) {
    throw new Error(`Hashes for ${filename} do not match. Expected: ${expected}, Actual: ${actual}`)
  }
}

const validateSignature = async (version, filename) => {
  console.log(`> validating signature for ${filename}`)

  const filepath = `${cachePath}/${version}/${filename}`

  const ctMessage = await fs.readFileAsync(`${filepath}`, 'utf8')
  const ctSignature = await fs.readFileAsync(`${filepath}.asc`, 'utf8')
  const ctPubKey = pubKey

  const options = {
    message: await openpgp.cleartext.readArmored(ctSignature),
    publicKeys: (await openpgp.key.readArmored(ctPubKey)).keys
  }

  const valid = await openpgp.verify(options)

  if (typeof valid.signatures === 'undefined' && typeof valid.signatures[0] === 'undefined') {
    throw new Error('Invalid Signature')
  }

  if (valid.signatures[0].valid === false) {
    throw new Error('PGP Signature is not valid')
  }
}

const extractUpdate = (version, filename) => {
  const filepath = `${cachePath}/${version}/${filename}`

  return new Promise((resolve, reject) => {
    console.log(`> extracting update ${filename}`)

    let stdout = ''
    let stderr = ''
    const extract = spawn('tar', ['-z', '-x', '-f', filepath, '-C', `${cachePath}/${version}`])
    extract.stdout.on('data', (data) => {
      stdout = `${stdout}${data}`
      console.log(data.toString())
    })
    extract.stderr.on('data', (data) => {
      stderr = `${stderr}${data}`
      console.log(data.toString())
    })
    extract.on('error', (err) => {
      reject(err)
    })
    extract.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error('Extraction returned exit code not zero'))
      }

      resolve()
    })
  })
}

const downloadUpdate = async (version) => {
  console.log(`> downloading ${version}`)

  await mkdirp(`${cachePath}/${version}`)
  await downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.asc`)
  await downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.sha256`)
  await downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.sha256.asc`)
  await downloadRelease(version)
  await validateFile(version, `sift-saltstack-${version}.tar.gz`)
  await validateSignature(version, `sift-saltstack-${version}.tar.gz.sha256`)
  await extractUpdate(version, `sift-saltstack-${version}.tar.gz`)
}

const performUpdate = (version) => {
  const filepath = `${cachePath}/${version}/sift-saltstack-${version.replace('v', '')}`
  const outputFilepath = `${cachePath}/${version}/results.yml`
  const logFilepath = `${cachePath}/${version}/saltstack.log`

  const begRegex = /Running state \[(.*)\] at time (.*)/g
  const endRegex = /Completed state \[(.*)\] at time (.*) duration_in_ms=(.*)/g

  const stateApplyMap = {
    'desktop': 'sift.desktop',
    'server': 'sift.server',
    'complete': 'sift.vm',
    'packages-only': 'sift.pkgs'
  }

  return new Promise((resolve, reject) => {
    console.log(`> performing update ${version}`)

    console.log(`>> Log file: ${logFilepath}`)

    if (os.platform() !== 'linux') {
      console.log(`>>> Platform is not linux`)
      return process.exit(0)
    }

    let stdout = ''
    let stderr = ''

    const logFile = fs.createWriteStream(logFilepath)

    const updateArgs = [
      '-l', 'debug', '--local',
      '--file-root', filepath,
      '--state-output=terse',
      '--out=yaml',
      'state.apply', stateApplyMap[cli['--mode']],
      `pillar={sift_user: "${siftConfiguration['user']}"}`
    ]

    const update = spawn('salt-call', updateArgs)

    update.stdout.pipe(fs.createWriteStream(outputFilepath))
    update.stdout.pipe(logFile)

    update.stderr.pipe(logFile)
    update.stderr
      .pipe(split())
      .on('data', (data) => {
        stderr = `${stderr}${data}`

        const begMatch = begRegex.exec(data)
        const endMatch = endRegex.exec(data)

        if (begMatch !== null) {
          process.stdout.write(`\n>> Running: ${begMatch[1]}\r`)
        } else if (endMatch !== null) {
          let message = `>> Completed: ${endMatch[1]} (Took: ${endMatch[3]} ms)`
          if (process.stdout.isTTY === true) {
            readline.clearLine(process.stdout, 0)
            readline.cursorTo(process.stdout, 0)
          }

          process.stdout.write(`${message}`)
        }
      })

    update.on('error', (err) => {
      console.log(arguments)

      reject(err)
    })
    update.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error('Update returned exit code not zero'))
      }

      process.nextTick(resolve)
    })
  })
}

const summarizeResults = async (version) => {
  const outputFilepath = `${cachePath}/${version}/results.yml`
  const rawContents = await fs.readFileAsync(outputFilepath)
  let results = {}

  try {
    results = yaml.safeLoad(rawContents, { schema: PYTHON_SCHEMA })
  } catch (err) {
    // TODO handle?
  }

  let success = 0
  let failure = 0
  let failures = [];

  Object.keys(results['local']).forEach((key) => {
    if (results['local'][key]['result'] === true) {
      success++
    } else {
      failure++
      failures.push(results['local'][key])
    }
  })

  if (failure > 0) {
    console.log(`\n\n>> Incomplete due to Failures -- Success: ${success}, Failure: ${failure}`)
    console.log(`\n>>>> List of Failures (first 10 only)`)
    console.log(`\n     NOTE: First failure is generally the root cause.`)
    console.log(`\n     IMPORTANT: If opening a ticket, please include this information.\n`)
    failures.sort((a, b) => {
      return a['__run_num__'] - b['__run_num__']
    }).slice(0, 10).forEach((key) => {
      console.log(`      - ID: ${key['__id__']}`)
      console.log(`        SLS: ${key['__sls__']}`)
      console.log(`        Run#: ${key['__run_num__']}`)
      console.log(`        Comment: ${key['comment']}`)
    })

    return new Promise((resolve, reject) => { return resolve() })
  }

  console.log(`\n\n>> COMPLETED SUCCESSFULLY -- Success: ${success}, Failure: ${failure}`)
}

const saveConfiguration = (version) => {
  const config = {
    version: version,
    mode: cli['--mode'],
    user: cli['--user'],
  }

  return fs.writeFileAsync(configFile, yaml.safeDump(config))
}

const loadConfiguration = async () => {
  try {
    return await fs.readFileAsync(configFile).then((c) => yaml.safeLoad(c))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        mode: cli['--mode'],
        user: cli['--user']
      }
    }

    throw err
  }
}

const run = async () => {
  if (cli['-v'] === true) {
    console.log(`Version: ${cfg.version}`)
    return process.exit(0)
  }

  console.log(`> sift-cli@${cfg.version}`)

  if (cli['debug'] === true) {
    const config = await loadConfiguration()

    const debug = `
Version: ${cfg.version}
User: ${currentUser}

Config:
${yaml.safeDump(config)}
`
    console.log(debug)
    return process.exit(0)
  }

  if (currentUser === 'root') {
    console.log('Warning: You are running as root.')
    if (currentUser === cli['--user']) {
      console.log('Error: You cannot install as root without specifying the --user option.')
      console.log()
      console.log('The install user specified with --user must not be the root user.')
      return process.exit(5)
    }
  }

  checkOptions()

  await setup()

  await validOS()

  siftConfiguration = await loadConfiguration()

  const version = await getCurrentVersion()
  console.log(`> sift-version: ${version}\n`)

  if (version !== 'notinstalled') {
    if (semver.lt(semver.coerce(version, { loose: true }), '2019.11.0') === true) {
      if (cli['--mode'] === 'desktop') {
        cli['--mode'] = 'complete'
      } else if (cli['--mode'] === 'server') {
        cli['--mode'] = 'packages-only'
      }
    }
  }

  console.log(`> mode: ${cli['--mode']}`)

  if (cli['version'] === true) {
    return process.exit(0)
  }

  if (cli['list-upgrades'] === true) {
    const releases = await getValidReleases()
    const current = await getCurrentVersion()
    if (releases.length === 0 || releases[0] === current) {
      console.log('No upgrades available')
      return process.exit(0)
    }

    console.log('> List of available releases')
    releases.forEach(release => console.log(`  - ${release}`))
    return process.exit(0)
  }

  if (!process.env.SUDO_USER && cli['--dev'] === false) {
    console.log('> Error! You must be root to execute this.')
    return process.exit(1)
  }

  await setupSalt()

  if (cli['update'] === true) {
    if (version === 'notinstalled') {
      throw new Error('SIFT not installed, unable to update')
    }

    await downloadUpdate(version)
    await performUpdate(version)
    await summarizeResults(version)
  }

  if (cli['install'] === true) {
    const currentVersion = await getCurrentVersion(versionFile)

    if (currentVersion !== 'notinstalled') {
      console.log('SIFT already installed, please use the update or upgrade command')
      return process.exit(0)
    }

    let versionToInstall = null
    if (cli['--version'] === 'latest') {
      versionToInstall = await getLatestRelease()
    } else {
      const validRelease = await isValidRelease(cli['--version'])

      if (validRelease === false) {
        console.log(`${cli['--version']} is not a valid release of the SIFT Workstation`)
        return process.exit(5)
      }

      versionToInstall = cli['--version']
    }

    if (versionToInstall === null) {
      throw new Error('versionToInstall was null, this should never happen, a bug was reported')
    }

    await validateVersion(versionToInstall)
    await downloadUpdate(versionToInstall)
    await performUpdate(versionToInstall)
    await summarizeResults(versionToInstall)
    await saveConfiguration(versionToInstall)
  }

  if (cli['upgrade'] === true) {
    const release = await getLatestRelease()
    const current = await getCurrentVersion()

    if (release === current || typeof release === 'undefined') {
      console.log('No upgrades available')
      process.exit(0)
    }

    await downloadUpdate(release)
    await performUpdate(release)
    await summarizeResults(release)
  }
}

const main = async () => {
  try {
    await run()
  } catch (err) {
    error(err)
  }
}

main()
