import { defineRecorder } from "versioncam";

type Requests = {
  get(url: string): Promise<{ json(): Promise<any> }>;
  post(
    url: string,
    options: { data: unknown },
  ): Promise<{ json(): Promise<any> }>;
};

// The account the clips sign in with. It exists only in the throwaway
// Lowcoder container the workflow starts, so its password is not a secret
// anywhere else. The first run in a new container signs it up.
const account = {
  loginId: "demo@example.com",
  password: "demo-recording",
  source: "EMAIL",
  authId: "EMAIL",
};

// Signs in through the same form-login API the sign-in page uses, unless the
// browser already has a session. Returns whether it had to sign in. A clip
// calls it too, to create the app it records before its first frame.
export async function signIn(request: Requests): Promise<boolean> {
  const me = await (await request.get("/api/users/me")).json();
  if (!me.data?.isAnonymous) return false;
  const signedIn = await (
    await request.post("/api/auth/form/login", {
      data: { ...account, register: false },
    })
  ).json();
  if (!signedIn.success) {
    await request.post("/api/auth/form/login", {
      data: { ...account, register: true },
    });
  }
  return true;
}

export default defineRecorder({
  // Vite's server.port in vite.config.mts.
  baseUrl: "http://localhost:8000",
  webServer: {
    // The editor from this checkout, through this package's own start script
    // (Vite), with its API from a Lowcoder container on port 3000, the pairing
    // the repository's start-win script uses. A container outlives the command
    // that starts it, so the recorder does not start it:
    // .github/workflows/versioncam.yml does, and on your machine you start it
    // once with `docker run -d -p 3000:3000 lowcoderorg/lowcoder-ce:3.0.0`.
    // BROWSER=none stops Vite opening a browser tab of its own (server.open).
    command: "yarn start",
    env: { LOWCODER_API_SERVICE_URL: "http://localhost:3000", BROWSER: "none" },
    // Asked through Vite's proxy, so it answers only once the API behind the
    // dev server is up too.
    url: "http://localhost:8000/api/configs",
    timeoutMs: 300_000,
  },
  clips: "demos/clips/**/*.clip.ts",
  // The clip walks the Layers panel from opening it to reordering a layer,
  // which takes 15 to 20 seconds to show at a readable pace.
  review: { minSeconds: 15, maxSeconds: 20 },
  auth: {
    // Lowcoder sends a visitor without a session to its sign-in page once it
    // has asked the API who they are, so the hook asks first, and after
    // signing in loads the page that was asked for again.
    login: async (page) => {
      if (await signIn(page.request)) await page.reload();
    },
  },
});
