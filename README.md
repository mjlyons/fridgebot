# FridgeBot

A Node.js TypeScript project.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Authentication:

```bash
npm run auth
```

This will generate a refresh token. Copy the token and set it in your `.env` file:

```
RING_REFRESH_TOKEN=your_generated_token_here
```

3. Development:

```bash
npm run dev
```

4. Build:

```bash
npm run build
```

5. Start:

```bash
npm start
```

### To keep the monitor running all the time (on Debian-based systems)

_From ChatGPT (TODO: verify this works)_

The most reliable and native way to do this on Ubuntu is to use **systemd**. It’s built into all modern Ubuntu versions (15.04+), and it’s specifically designed to manage services and automatically restart them if they crash or exit.

---

#### ✅ **1. Create a systemd service file**

Create a new service file, e.g.:

```bash
sudo nano /etc/systemd/system/myprocess.service
```

Example contents:

```ini
[Unit]
Description=My Custom Process
After=network.target

[Service]
ExecStart=/path/to/your/script-or-binary
Restart=always
RestartSec=30                     # Wait 30 seconds before restarting
User=yourusername                 # Optional: run as specific user
Environment=NODE_ENV=production   # Optional: any env vars

[Install]
WantedBy=multi-user.target
```

Explanation:

- `Restart=always`: automatically restart no matter why it exited.
- `RestartSec=30`: adds a delay before restart. Do this to prevent DDoSing Ring services.
- `WantedBy=multi-user.target`: makes it start on boot.

---

#### ✅ **2. Reload systemd and enable the service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable myprocess.service     # enable on boot
sudo systemctl start myprocess.service      # start it now
```

---

#### ✅ **3. Monitor and control your service**

```bash
sudo systemctl status myprocess.service     # view status
sudo journalctl -u myprocess.service        # view logs
sudo systemctl stop myprocess.service       # stop
sudo systemctl restart myprocess.service    # restart manually
```

---

#### 💡 **This method is very reliable because:**

- It survives reboots.
- It restarts on any exit/crash.
- You can delay the restart (`RestartSec`).
- It integrates cleanly with Ubuntu’s startup and shutdown processes.
- systemd is extremely well-supported and safe for production environments.

## Project Structure

- `src/` - Source files
- `dist/` - Compiled JavaScript files
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration

## TODO

- [x] hook up dead man's snitch
- [ ] update the .env docs
- [ ] update config setup in docs
- [x] Add ability to configure per-sensor alert timeout
