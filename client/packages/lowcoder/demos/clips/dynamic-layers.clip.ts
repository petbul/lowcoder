import { clip } from "versioncam";
import { signIn } from "../../versioncam.config";

const text = (name: string, markdown: string) => ({
  compType: "text",
  name,
  comp: { text: markdown, type: "markdown", autoHeight: "auto" },
});

// A profile card and an avatar beside it: the app the clip opens.
const APP = {
  ui: {
    layout: {
      card: {
        i: "card",
        x: 1,
        y: 6,
        w: 12,
        h: 28,
        pos: 0,
        delayCollision: true,
      },
      badge: { i: "badge", x: 16, y: 10, w: 4, h: 7, pos: 1 },
    },
    items: {
      card: {
        compType: "container",
        name: "profileCard",
        comp: {
          container: {
            header: {
              layout: { t: { i: "t", x: 0, y: 0, w: 24, h: 5 } },
              items: { t: text("cardTitle", "### Mira Halloran") },
            },
            body: {
              "0": {
                view: {
                  layout: { b: { i: "b", x: 0, y: 0, w: 24, h: 9 } },
                  items: {
                    b: text(
                      "cardText",
                      "Product designer in Lisbon. Looks after the design system and the first-run experience.",
                    ),
                  },
                },
              },
            },
            footer: { layout: {} },
            showHeader: true,
            showBody: true,
            autoHeight: "auto",
            horizontalGridCells: 24,
            style: { borderWidth: "1px" },
          },
        },
      },
      badge: {
        compType: "avatar",
        name: "avatar1",
        comp: {
          icon: "/icon:solid/user",
          iconSize: "56",
          shape: "circle",
          avatarLabel: "",
          avatarCatption: "",
        },
      },
    },
  },
};

export default clip(
  "dynamic-layers",
  { title: "Place a component over another with dynamic Layers", seed: 5 },
  async (s) => {
    // A new app every run: the Layers switch is saved with the app, so a reused
    // one would start the next run with it already on.
    const id = await s.offCamera(async (page) => {
      await signIn(page.request);
      const me = await (await page.request.get("/api/users/me")).json();
      const created = await (
        await page.request.post("/api/applications", {
          data: {
            orgId: me.data.currentOrgId,
            name: "Team profile",
            applicationType: 1,
            editingApplicationDSL: APP,
          },
        })
      ).json();
      return created.data.applicationInfoView.applicationId as string;
    });
    await s.open(`/apps/${id}/edit`);
    s.caption("Place a component over another with dynamic Layers");
    await s.hold(1200);

    // Layers is the fifth button in the editor's left sidebar.
    await s.click(
      s.css(".ant-layout-sider li.ant-menu-item[data-menu-id$='-layout']"),
    );
    await s.settle({ label: "layers panel" });
    await s.hold(1500);

    await s.click(s.byRole("switch"));
    await s.settle({ label: "dynamic layers on" });
    await s.hold(1500);

    // Closer on the Layers panel and the card for the rest: the avatar is
    // 56 pixels across, and what changes next is which of the two is on top.
    // The frame stops above the query panel, so the caption has a plain
    // background under it.
    s.camera.to({ x: 30, y: 40, w: 900, h: 562 });

    // From the avatar to just past the card's top right corner, as fractions
    // of the canvas: dropped there, the avatar stays a component of its own
    // and overlaps the card, which only dynamic Layers allows.
    await s.drag(
      s.css(".react-grid-layout:not(.react-grid-layout .react-grid-layout)"),
      { x: 0.713, y: 0.14 },
      { x: 0.545, y: 0.105 },
      { duration: 1800 },
    );
    await s.settle({ label: "avatar on the card's corner" });
    await s.hold(1200);

    // A click on the empty canvas below the card clears the selection, which
    // a selected component is drawn above everything else for.
    await s.click(
      s.css(".react-grid-layout:not(.react-grid-layout .react-grid-layout)"),
    );
    await s.settle({ label: "avatar behind the card" });
    await s.hold(1300);

    // The first component in the Layers list is drawn on top, so moving the
    // avatar above the card there brings it in front of the card.
    await s.drag(
      s.css(
        ".cypress-left-content .ant-tree-node-content-wrapper:has-text('avatar1')",
      ),
      s.css(
        ".cypress-left-content .ant-tree-node-content-wrapper:has-text('profileCard')",
      ),
      { duration: 1200 },
    );
    await s.settle({ label: "avatar in front" });
    await s.hold(1800);
    s.camera.reset();
    await s.hold(1300);
  },
);
