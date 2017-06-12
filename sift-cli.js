const pkg = require('./package.json')
const cfg = require('./config.json')
const Promise = require('bluebird')
const os = require('os')
const fs = Promise.promisifyAll(require('fs'))
const child_process = Promise.promisifyAll(require('child_process'))
const path = require('path')
const crypto = require('crypto')
const spawn = require('child_process').spawn
const co = require('bluebird-co')
const docopt = require('docopt').docopt
const GitHubApi = require('github')
const mkdirp = Promise.promisify(require('mkdirp'))
const request = require('request')
const openpgp = require('openpgp')
const Rollbar = require('rollbar')
const username = require('username')
const readline = require('readline')
const split = require('split')
const yaml = require('js-yaml')

const doc = `
Usage:
  sift [options] list-upgrades [--pre-release]
  sift [options] install [--pre-release] <version>
  sift [options] update
  sift [options] upgrade [--pre-release]
  sift [options] version
  sift -h | --help | --version

Options:
  --dev   Developer Mode (do not use, dangerous, bypasses checks)
`

const pubKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: GPGTools - http://gpgtools.org

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
xUlS5QCeIuCyDm3icTtEq3/j6MpEjUkrMJk=
=QmII
-----END PGP PUBLIC KEY BLOCK-----
`

let cachePath = '/var/cache/sift/cli'
let versionFile = '/etc/sift-version'

const cli = docopt(doc)

const github = new GitHubApi({
  version: '3.0.0',
  validateCache: true,
  Promise: Promise
})

const rollbar = new Rollbar({
  accessToken: cfg.rollbar,
  codeVersion: cfg.commit,
  branch: cfg.branch,
  environment: cfg.environment || 'development',
  host: crypto.createHash('sha256').update(os.hostname()).digest('hex').substr(0, 35),
  handleUncaughtExceptions: true,
  handleUnhandledRejections: true,
})

const user = { id: crypto.createHash('sha256').update(username.sync()).digest('hex').substr(0, 35) }

function error (err) {
  console.log('')
  console.log(err.message)
  console.log(err.stack)

  rollbar.wait(function() {
    process.exit(1)
  })
}

function setup () {
  return co.execute(function * () {
    if (cli['--dev'] === true) {
      cachePath = '/tmp/var/cache/sift'
      versionFile = '/tmp/sift-version'
    }

    yield mkdirp(cachePath)
  })
}

function fileExists (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, function (err, stats) {
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

function setupSalt() {
  if (cli['--dev'] === false) {
    return co.execute(function * () {
      const aptSourceList = '/etc/apt/sources.list.d/saltstack.list'
  
      const aptExists = yield fileExists(aptSourceList)

      if (aptExists === false) {
        console.log('Installing and configuring SaltStack properly ...')
        yield fs.writeFileAsync(aptSourceList, 'deb http://repo.saltstack.com/apt/ubuntu/16.04/amd64/latest xenial main')
        yield child_process.execAsync('wget -O - https://repo.saltstack.com/apt/ubuntu/16.04/amd64/latest/SALTSTACK-GPG-KEY.pub | apt-key add -')
        yield child_process.execAsync('apt-get update')
        yield child_process.execAsync('apt-get install -y salt-minion')
      }
    })
  } else {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}

function getCurrentVersion () {
  return fs.readFileAsync(versionFile)
            .catch((err) => {
              if (err.code === 'ENOENT') return 'notinstalled'
              if (err) throw err
            })
            .then(contents => contents.toString().replace(/\n/g, ''))
}

function getReleases () {
  return github.repos.getReleases({
    owner: 'sans-dfir',
    repo: 'sift-saltstack'
  })
}

function getValidReleases () {
  return co.execute(function * () {
    const currentRelease = yield getCurrentVersion()
    let releases = yield getReleases()
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
  })
}

function getLatestRelease () {
  return getValidReleases().then(releases => releases[0])
}

function validateVersion (version) {
  return getValidReleases().then((releases) => {
    if (typeof releases.indexOf(version) === -1) {
      throw new Error('The version you are wanting to install/upgrade to is not valid')
    }
    return new Promise((resolve, reject) => { resolve() })
  })
}

function downloadReleaseFile (version, filename) {
  console.log(`>> downloading ${filename}`)
  
  const filepath = `${cachePath}/${version}/${filename}`
  
  if (fs.existsSync(filepath)) {
    return new Promise((resolve, reject) => { resolve() })
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/sans-dfir/sift-saltstack/releases/download/${version}/${filename}`)
    req.on('error', (err) => {
      rollbar.error(err, {version, filename}, { user, route: { path: 'downloadReleaseFile' }})
      reject(err)
    })
    req
      .on('response', (res) => {
        if (res.statusCode !== 200)  {
          throw new Error(res.body)
        }
      })
      .pipe(output)
      .on('error', (err) => {
        rollbar.error(err, {version, filename}, { user, route: { path: 'downloadReleaseFile' }})
        reject(err)
      })
      .on('close', resolve)
  })
}

function downloadRelease (version) {
  console.log(`>> downloading sift-saltstack-${version}.tar.gz`)
  
  const filepath = `${cachePath}/${version}/sift-saltstack-${version}.tar.gz`
  
  if (fs.existsSync(filepath)) {
    return new Promise((resolve, reject) => { resolve() })
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/sans-dfir/sift-saltstack/archive/${version}.tar.gz`)
    req.on('error', (err) => {
      rollbar.error(err, { user, route: { path: 'downloadRelease' }})
      reject(err)
    })
    req
      .pipe(output)
      .on('error', (err) => {
        rollbar.error(err, {version, filename}, { user, route: { path: 'downloadRelease' }})
        reject(err)
      })
      .on('close', resolve)
  })
}

function validateFile (version, filename) {
  console.log(`> validating file ${filename}`)
  return co.execute(function * () {
    const expected = yield fs.readFileAsync(`${cachePath}/${version}/${filename}.sha256`)

    const actual = yield new Promise((resolve, reject) => {
      const shasum = crypto.createHash('sha256')
      fs.createReadStream(`${cachePath}/${version}/${filename}`)
        .on('error', (err) => {
          rollbar.error(err, {version, filename}, { user, route: { path: 'validateFile' }})
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
  })
}

function validateSignature (version, filename) {
  console.log(`> validating signature for ${filename}`)
  return co.execute(function * () {

    const filepath = `${cachePath}/${version}/${filename}`

    const ctMessage = yield fs.readFileAsync(`${filepath}`, 'utf8')
    const ctSignature = yield fs.readFileAsync(`${filepath}.asc`, 'utf8')
    const ctPubKey = pubKey

    const sig = openpgp.cleartext.readArmored(ctSignature)
    const valid = yield sig.verify(openpgp.key.readArmored(ctPubKey).keys)

    if (typeof valid[0] === 'undefined') {
      throw new Error('Invalid Signature')
    }

    if (valid[0].valid === false) {
      throw new Error('PGP Signature is not valid')
    }
  })
}

function extractUpdate(version, filename) {
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
      rollbar.error(err, {version, filename}, { user, route: { path: 'extractUpdate' }})
      reject(err)
    })
    extract.on('close', (code) => {
      if (code !== 0) {
        rollbar.error(`extractUpdate exited with ${code}`, {stdout, stderr}, { user, route: { path: 'extractUpdate' }})
        return reject(new Error('Extraction returned exit code not zero'))
      }
    
      resolve()
    })
  })
}

function downloadUpdate(version) {
  console.log(`> downloading ${version}`)
  return co.execute(function * () {
    yield mkdirp(`${cachePath}/${version}`)
    yield downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.asc`)
    yield downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.sha256`)
    yield downloadReleaseFile(version, `sift-saltstack-${version}.tar.gz.sha256.asc`)
    yield downloadRelease(version)
    yield validateFile(version, `sift-saltstack-${version}.tar.gz`)
    yield validateSignature(version, `sift-saltstack-${version}.tar.gz.sha256`)
    yield extractUpdate(version, `sift-saltstack-${version}.tar.gz`)
  })
}

function performUpdate(version) {
  const filepath = `${cachePath}/${version}/sift-saltstack-${version.replace('v', '')}`
  const outputFilepath = `${cachePath}/${version}/results.yml`
  const logFilepath = `${cachePath}/${version}/saltstack.log`

  const begRegex = /Running state \[(.*)\] at time (.*)/g
  const endRegex = /Completed state \[(.*)\] at time (.*) duration_in_ms=(.*)/g

  return new Promise((resolve, reject) => {
    console.log(`> performing update ${version}`)

    console.log(`>> Log file: ${logFilepath}`)
    
    if (os.platform() !== 'linux') {
      console.log(`>>> Platform is not linux`)
      return reject(new Error('Platform is not linux'))
    }

    let stdout = ''
    let stderr = ''
    
    const logFile = fs.createWriteStream(logFilepath)

    const update = spawn('salt-call', ['-l', 'info', '--local', '--file-root', filepath, '--state-output=terse', '--out=yaml', 'state.apply', 'sift.vm'])
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
      rollbar.error(err, {version}, { user, route: { path: 'performUpdate' }})
      reject(err)
    })
    update.on('close', (code) => {
      if (code !== 0) {
        rollbar.error(`performUpdate exited with ${code}`, {stdout, stderr}, { user, route: { path: 'performUpdate' }})
        return reject(new Error('Update returned exit code not zero'))
      }

      process.nextTick(resolve)
    })
  })
}

function summarizeResults (version) {
  return co.execute(function * () {
    const outputFilepath = `${cachePath}/${version}/results.yml`
    const rawContents = yield fs.readFileAsync(outputFilepath)
    const results = yaml.safeLoad(rawContents)

    let success = 0
    let failure = 0

    Object.keys(results['local']).forEach((key) => {
      if (results['local'][key]['result'] === true) {
        success++
      } else {
        failure++
      }
    })

    if (failure > 0) {
      console.log(`\n\n>> Completed with Failures -- Success: ${success}, Failure: ${failure}`)
      return new Promise((resolve, reject) => { return resolve() })
    }

    console.log(`\n\n>> COMPLETED SUCCESSFULLY -- Success: ${success}, Failure: ${failure}`)
  })
}

co.execute(function * () {
  if (cli['--version'] === true) {
    console.log(`Version: ${pkg.version}, Build: ${cfg.branch}-${cfg.commit}`)
    return process.exit(0)
  }
  
  console.log(`> sift-cli@${pkg.version}-${cfg.branch}.${cfg.commit}`)

  yield setup()

  const version = yield getCurrentVersion()
  console.log(`> sift-version: ${version}\n`)

  if (cli['version'] === true) {
    return process.exit(0)
  }

  if (cli['list-upgrades'] === true) {
    const releases = yield getValidReleases()
    const current = yield getCurrentVersion()
    if (releases.length === 0 || releases[0] === current) {
      console.log('No upgrades available')
      return process.exit(0)
    }

    console.log('> List of available releases')
    releases.forEach(release => console.log(`  - ${release}`))
    return process.exit(0)
  }

  const whoIAm = username.sync()
  
  if (whoIAm !== 'root' && cli['--dev'] === false) {
    console.log('> Error! You must be root to execute this.')
    return process.exit(1)
  }

  yield setupSalt()

  if (cli['update'] === true) {
    if (version === 'notinstalled') {
      throw new Error('SIFT not installed, unable to update')
    }

    yield downloadUpdate(version)
    yield performUpdate(version)
    yield summarizeResults(version)
  }

  if (cli['install'] === true) {
    yield validateVersion(cli['<version>'])
    yield downloadUpdate(cli['<version>'])
    yield performUpdate(cli['<version>'])
    yield summarizeResults(cli['<version>'])
  }

  if (cli['upgrade'] === true) {
    const release = yield getLatestRelease()
    const current = yield getCurrentVersion()

    if (release === current || typeof release === 'undefined') {
      console.log('No upgrades available')
      process.exit(0)
    }

    yield downloadUpdate(release)
    yield performUpdate(release)
    yield summarizeResults(release)
  }
}).catch(error)
