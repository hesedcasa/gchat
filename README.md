# sentry

CLI for Google Chat API interaction

[![Version](https://img.shields.io/npm/v/@hesed/gchat.svg)](https://npmjs.org/package/@hesed/gchat)
[![Downloads/week](https://img.shields.io/npm/dw/@hesed/gchat.svg)](https://npmjs.org/package/@hesed/gchat)

# Install

```bash
sdkck plugins install @hesed/gchat
```

<!-- toc -->
* [sentry](#sentry)
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
@hesed/gchat/0.1.0 darwin-arm64 node-v22.14.0
$ gchat --help [COMMAND]
USAGE
  $ gchat COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`gchat gchat create-message SPACEID`](#gchat-gchat-create-message-spaceid)
* [`gchat gchat reply-message THREADNAME`](#gchat-gchat-reply-message-threadname)

## `gchat gchat create-message SPACEID`

Send a message to a Google Chat space

```
USAGE
  $ gchat gchat create-message SPACEID -m <value> [-f] [--toon]

ARGUMENTS
  SPACEID  Google Chat space ID

FLAGS
  -f, --formatted        Enable formatted text (bold, italic, links)
  -m, --message=<value>  (required) Message text to send
      --toon             Format output as toon

DESCRIPTION
  Send a message to a Google Chat space

EXAMPLES
  $ gchat gchat create-message AAQAKA6hsFw --message "Hello team"

  $ gchat gchat create-message AAQAKA6hsFw --message "*Bold message*" --formatted
```

_See code: [src/commands/gchat/create-message.ts](https://github.com/hesedcasa/gchat/blob/v0.1.0/src/commands/gchat/create-message.ts)_

## `gchat gchat reply-message THREADNAME`

Reply to a message thread in Google Chat

```
USAGE
  $ gchat gchat reply-message THREADNAME -m <value> [-f] [--toon]

ARGUMENTS
  THREADNAME  Thread name (e.g. spaces/SPACE_ID/threads/THREAD_ID)

FLAGS
  -f, --formatted        Enable formatted text (bold, italic, links)
  -m, --message=<value>  (required) Message text to send
      --toon             Format output as toon

DESCRIPTION
  Reply to a message thread in Google Chat

EXAMPLES
  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA --message "Reply here"

  $ gchat gchat reply-message spaces/AAQAKA6hsFw/threads/D1NI3W2B6vA --message "*Bold reply*" --formatted
```

_See code: [src/commands/gchat/reply-message.ts](https://github.com/hesedcasa/gchat/blob/v0.1.0/src/commands/gchat/reply-message.ts)_
<!-- commandsstop -->
