import { Inngest } from "inngest";
import { prisma } from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "Group13-Project" });

//User Create
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_addres,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  },
);

//Delete
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  },
);

// Update
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data?.email_addresses[0]?.email_addres,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      },
    });
  },
);

// Create workspace
const syncWorkspaceCreation = inngest.createFunction(
  {
    id: "sync-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    // Admin entry
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  },
);

// Update workspace
const syncWorkspaceUpdation = inngest.createFunction(
  {
    id: "update-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.updated" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
    });
  },
);

// Delete workspace
const syncWorkspaceDeletion = inngest.createFunction(
  {
    id: "delete-workspace-with-clerk",
    triggers: [{ event: "clerk/organization.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.delete({
      where: { id: data.id },
    });
  },
);

// Member creation
const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: "sync-workspace-member-from-clerk",
    triggers: [{ event: "clerk/organizationMembership.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: (data.role_name || "member").toUpperCase(),
      },
    });
  },
);

//send email
const sendTaskAssignmentEmail = inngest.createFunction(
  {
    id: "send-task-assignment-mail",
    triggers: [{ event: "app/task.assigned" }],
  },
  async ({ event, step }) => {

    const { taskId, origin } = event.data;

    const task = await step.run("fetch-task", async () => {
      return await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignee: true, project: true }
      });
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!task.assignee?.email) {
      return;
    }

    await step.run("send-email", async () => {
      await sendEmail({
        to: task.assignee.email,
        subject: `New task assignment in ${task.project.name}`,
        body: `
          <h3>Hi ${task.assignee.name},</h3>
          <p>You have been assigned a new task.</p>
          <p><strong>Task Title:</strong> ${task.title}</p>
          <p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
          <a href="${origin}">View Task</a>
        `
      });
    });

  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceUpdation,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail,
];
