# Olive
<img src=".github/assets/olive-pfp.png" align="right" width="96px" height="96px">

Olive is a Slack selfbot developed made to do helpful little tasks! She was created for the Hack Club [Doppel](https://doppel.hackclub.com/) YSWS program.

## Setup
Since Olive runs primarily on the Slack RTM API, she needs to be able to access WebSocket APIs. Node.js implemented global WebSocket in `v22.4.0`, and so this is the minimum version required to run Olive.

You could run Olive on Node.js `v21` and above if you enable the experimental flags, however this hasn't been tested.

1. Clone repository to your machine:
```sh
$ git clone https://github.com/DaInfLoop/olive.git
```

2. Install dependencies:
```sh
$ pnpm i
# or use your package manager of choice
```

3. Create a Slack app on your selfbot's account. It should:
    - Have the `chat:write` scope on the user token.
    - At least one scope on the bot token (in order for it to generate).
    - Have Socket Mode enabled.

3. Setup environmental variables in `.env`:
```
XAPP=
XOXB=
XOXC=
XOXD=
XOXP=

SIGNING_SECRET=
```

<details>
<summary>What does each variable mean?</summary>

`XAPP` is an App-Level Token. It's generated when you enable Socket Mode, and can be found later again in the `Basic Information` section of the Slack Developer Portal under `App-Level Tokens`. **It starts with `xapp-1-`.**

`XOXB` is a Bot User OAuth Token. It's generated when you install the app to the workspace, and can be found later again clicking `Install App` in the Slack Developer Portal. **It starts with `xoxb-`.**

`XOXC` is a User Token. It's generated from the Slack client when you login, and can be found by inspecting a HTTP request from your client to Slack's API. **It starts with `xoxc-`.**

`XOXD` is a User Session Key. It's generated from the Slack client when you login, and can be found by inspecting your browser cookies for `app.slack.com`. **When you enter this into the `.env` file, make sure it is URL encoded. It starts with `xoxd-`.**

`XOXP` is a User OAuth Token. It's generated when you install the app to the workspace, and can be found later again clicking `Install App` in the Slack Developer Portal. **It starts with `xoxp-`.**

`SIGNING_SECRET` is the signing secret generated when you create a Slack App. It can be found later again in the `Basic Information` section of the Slack Developer Portal under `App Credentials`.
</details>

## What do it do?
Olive currently doesn't have much functionality. Currently, she welcomes people to my personal channel. If you're on the Hack Club Slack, feel free to drop by and join [`#where-night-falls`](https://hackclub.enterprise.slack.com/archives/C06SY7X0ESK)! _(I heard she gives out cookies!)_

## License
This repository is licensed under the GNU Affero General Public License v3.0. A copy of the license can be viewed at [LICENSE](/LICENSE).