# gchat

CLI for Google Chat API interaction

[![Version](https://img.shields.io/npm/v/@hesed/gchat.svg)](https://npmjs.org/package/@hesed/gchat)
[![Downloads/week](https://img.shields.io/npm/dw/@hesed/gchat.svg)](https://npmjs.org/package/@hesed/gchat)

# Install

```bash
sdkck plugins install @hesed/gchat
```

<!-- toc -->
* [gchat](#gchat)
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @hesed/gchat
$ gchat COMMAND
running command...
$ gchat (--version)
@hesed/gchat/0.3.0 linux-x64 node-v22.23.1
$ gchat --help [COMMAND]
USAGE
  $ gchat COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`gchat gchat config add-token PROFILE SPACEID TOKEN`](#gchat-gchat-config-add-token-profile-spaceid-token)
* [`gchat gchat config set-key PROFILE KEY`](#gchat-gchat-config-set-key-profile-key)
* [`gchat gchat create-message SPACEID MESSAGE`](#gchat-gchat-create-message-spaceid-message)
* [`gchat gchat reply-message THREADNAME MESSAGE`](#gchat-gchat-reply-message-threadname-message)

## `gchat gchat config add-token PROFILE SPACEID TOKEN`

Add or update an API token for a Google Chat space within a profile

```
USAGE
  $ gchat gchat config add-token PROFILE SPACEID TOKEN

ARGUMENTS
  PROFILE  Config profile name
  SPACEID  Google Chat space ID
  TOKEN    API token for this space

DESCRIPTION
  Add or update an API token for a Google Chat space within a profile

EXAMPLES
  $ gchat gchat config add-token default AAQAKA6hsFw your-space-token
```

_See code: [src/commands/gchat/config/add-token.ts](https://github.com/hesedcasa/gchat/blob/v0.3.0/src/commands/gchat/config/add-token.ts)_

## `gchat gchat config set-key PROFILE KEY`

Set the Google Chat API key for a profile

```
USAGE
  $ gchat gchat config set-key PROFILE KEY

ARGUMENTS
  PROFILE  Config profile name
  KEY      Google Chat API key

DESCRIPTION
  Set the Google Chat API key for a profile

EXAMPLES
  $ gchat gchat config set-key default your-api-key

  $ gchat gchat config set-key work your-work-api-key
```

_See code: [src/commands/gchat/config/set-key.ts](https://github.com/hesedcasa/gchat/blob/v0.3.0/src/commands/gchat/config/set-key.ts)_

## `gchat gchat create-message SPACEID MESSAGE`

Send a message to a Google Chat space

```
USAGE
  $ gchat gchat create-message SPACEID MESSAGE [-f] [-p <value>] [--toon]

ARGUMENTS
  SPACEID  Google Chat space ID
  MESSAGE  Message text to send

FLAGS
  -f, --formatted        Enable formatted text (bold, italic, links)
  -p, --profile=<value>  [default: default] Config profile to use
      --toon             Format output as toon

DESCRIPTION
  Send a message to a Google Chat space

EXAMPLES
  $ gchat gchat create-message AAQAKA6hsFw "Hello team"

  $ gchat gchat create-message AAQAKA6hsFw "Hello work" --profile work

  $ gchat gchat create-message AAQAKA6hsFw "*Bold message*" --formatted

  $ gchat gchat create-message AAQAKA6hsFw "<https://example.com|Click here>" -f
```

_See code: [src/commands/gchat/create-message.ts](https://github.com/hesedcasa/gchat/blob/v0.3.0/src/commands/gchat/create-message.ts)_

## `gchat gchat reply-message THREADNAME MESSAGE`

Reply to a message thread in Google Chat

```
USAGE
  $ gchat gchat reply-message THREADNAME MESSAGE [-f] [-p <value>] [--toon]

ARGUMENTS
  THREADNAME  Thread name (e.g. spaces/SPACE_ID/threads/THREAD_ID)
  MESSAGE     Message text to send

FLAGS
  -f, --formatted        Enable formatted text (bold, italic, links)
  -p, --profile=<value>  [default: default] Config profile to use
      --toon             Format output as toon

DESCRIPTION
  Reply to a message thread in Google Chat

EXAMPLES
  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Reply here"

  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Reply here" --profile work

  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "*Bold reply*" --formatted
```

_See code: [src/commands/gchat/reply-message.ts](https://github.com/hesedcasa/gchat/blob/v0.3.0/src/commands/gchat/reply-message.ts)_
<!-- commandsstop -->
