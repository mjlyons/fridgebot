# Fridgebot

Pages you via PagerDuty if you leave the fridge or freezer door open too long.
I wrote this after I left the fridge open all night. Never again!

## What you'll need

- A [Ring Alarm system](https://ring.com/home-security-system) with [door contact sensors](https://ring.com/products/alarm-window-door-contact-sensor-v2). I use one sensor for the fridge and another for the freezer.
- A [PagerDuty](https://www.pagerduty.com) account. PagerDuty is used to page you if the door is open too long. It'll also send a low-pri alert (probably just an email) if Fridgebot hits an error. The free tier is fine.
- A [DeadMansSnitch](https://www.deadmanssnitch.com) account. This will send you an email if Fridgebot stops running. The free tier is fine.
- A machine to run long-running nodejs scripts. A RaspberryPi works great for this.

## Setup

### 1. Clone this repository:

```bash
mkdir -p ~/src
git clone https://github.com/mjlyons/fridgebot.git ~/src/fridgebot
```

### 2. Install dependencies:

[Install nvm](https://github.com/nvm-sh/nvm) if you haven't already.

```bash
nvm install 20
nvm use 20
npm install
```

### 3. Authenticate with Ring, PagerDuty, and DeadMansSnitch:

```bash
npm run auth
```

This will generate a Ring refresh token. Copy the token and set it in your `.env` file (in ~/src/fridgebot), along with your PagerDuty and DMS keys:

```
RING_REFRESH_TOKEN=your_generated_token_here
PAGERDUTY_ROUTING_KEY=your_pagerduty_routing_key
DEAD_MANS_SNITCH_URL=your_dead_mans_snitch_url
```

### 4. Get the Ring LocationId and SensorId for each of your door sensors

You can get a list of locations with IDs for your ring account by running this command:

```bash
npm run dev list-locations
```

You can then get a list of door sensors using this command:

```bash
npm run dev list-sensors <location-id>
```

Once you have that, create a settings.json file:

```bash
cd ~/src/fridgebot
mkdir -p data
touch data/settings.json
```

Inside, your `data/settings.json` file should follow this example:

```
[
  {
    "description": "Fridge",
    "locationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "doorId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "doorOpenAlertDelaySec": 180
  },
  {
    "description": "Freezer",
    "locationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "doorId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "doorOpenAlertDelaySec": 180
  }
]
```

You can monitor an arbitrary number of door sensors, call them whatever you want, and configure different "open alert" delays for each.

### 5. Start:

```bash
npm run dev watch
```

You should see some console logging whenever you open and close the doors, and you should get a pagerduty page if you leave one open too long.

## Persistent setup (Ubuntu/RaspberryPi OS)

You'll probably want to host fridgebot on a machine that's up all the time. I use a RaspberryPi for this.

You'll also want to make sure it's always running, otherwise you can't count on it to page you. The most reliable and native way to do this on Ubuntu is to use **systemd**.

### 1. Create a script to start fridgebot.

I put my script in ~/scripts/run-fridgebot.sh. Don't forget to `chmod u+x <your-script>`!

```
#!/bin/sh

cd /home/<your-username>/src/fridgebot
. /home/<your-username>/.nvm/nvm.sh
nvm install 20
nvm use 20
npm run dev watch
```

### 2. Create a new service file:

```bash
sudo nano /etc/systemd/system/fridgebot.service
```

Here's the contents of mine:

```ini
[Unit]
Description=Fridgebot
After=network.target

[Service]
ExecStart=/home/<your-username>/scripts/run-fridgebot.sh
Restart=always
RestartSec=10s
User=<your-username>
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

This will start fridgebot at startup. If it ever crashes, systemd will wait 10 seconds and restart it.

### 3. Reload systemd and enable the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable myprocess.service     # enable on boot
sudo systemctl start myprocess.service      # start it now
```

4. Monitor and control your service

```bash
sudo systemctl status myprocess.service     # view status
sudo journalctl -u myprocess.service        # view logs
sudo systemctl stop myprocess.service       # stop
sudo systemctl restart myprocess.service    # restart manually
```
