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
@hesed/gchat/0.2.0 linux-x64 node-v20.20.0
$ gchat --help [COMMAND]
USAGE
  $ gchat COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`gchat gchat config add-token SPACEID TOKEN`](#gchat-gchat-config-add-token-spaceid-token)
* [`gchat gchat config set-key KEY`](#gchat-gchat-config-set-key-key)
* [`gchat gchat create-message SPACEID MESSAGE`](#gchat-gchat-create-message-spaceid-message)
* [`gchat gchat reply-message THREADNAME MESSAGE`](#gchat-gchat-reply-message-threadname-message)

## `gchat gchat config add-token SPACEID TOKEN`

Add or update an API token for a Google Chat space

```
USAGE
  $ gchat gchat config add-token SPACEID TOKEN

ARGUMENTS
  SPACEID  Google Chat space ID
  TOKEN    API token for this space

DESCRIPTION
  Add or update an API token for a Google Chat space

EXAMPLES
  $ gchat gchat config add-token AAQAKA6hsFw your-space-token
```

_See code: [src/commands/gchat/config/add-token.ts](https://github.com/hesedcasa/gchat/blob/v0.2.0/src/commands/gchat/config/add-token.ts)_

## `gchat gchat config set-key KEY`

Set the Google Chat API key in the config file

```
USAGE
  $ gchat gchat config set-key KEY

ARGUMENTS
  KEY  Google Chat API key

DESCRIPTION
  Set the Google Chat API key in the config file

EXAMPLES
  $ gchat gchat config set-key your-api-key
```

_See code: [src/commands/gchat/config/set-key.ts](https://github.com/hesedcasa/gchat/blob/v0.2.0/src/commands/gchat/config/set-key.ts)_

## `gchat gchat create-message SPACEID MESSAGE`

Send a message to a Google Chat space

```
USAGE
  $ gchat gchat create-message SPACEID MESSAGE [-f] [--toon]

ARGUMENTS
  SPACEID  Google Chat space ID
  MESSAGE  Message text to send

FLAGS
  -f, --formatted  Enable formatted text (bold, italic, links)
      --toon       Format output as toon

DESCRIPTION
  Send a message to a Google Chat space

EXAMPLES
  $ gchat gchat create-message AAQAKA6hsFw "Hello team"

  $ gchat gchat create-message AAQAKA6hsFw "*Bold message*" --formatted
```

_See code: [src/commands/gchat/create-message.ts](https://github.com/hesedcasa/gchat/blob/v0.2.0/src/commands/gchat/create-message.ts)_

## `gchat gchat reply-message THREADNAME MESSAGE`

Reply to a message thread in Google Chat

```
USAGE
  $ gchat gchat reply-message THREADNAME MESSAGE [-f] [--toon]

ARGUMENTS
  THREADNAME  Thread name (e.g. spaces/SPACE_ID/threads/THREAD_ID)
  MESSAGE     Message text to send

FLAGS
  -f, --formatted  Enable formatted text (bold, italic, links)
      --toon       Format output as toon

DESCRIPTION
  Reply to a message thread in Google Chat

EXAMPLES
  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "Reply here"

  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA "*Bold reply*" --formatted
```

_See code: [src/commands/gchat/reply-message.ts](https://github.com/hesedcasa/gchat/blob/v0.2.0/src/commands/gchat/reply-message.ts)_
<!-- commandsstop -->
