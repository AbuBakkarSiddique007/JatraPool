import { PoolStatus, RideStatus, UserRole } from "@prisma/client";
import { Response } from "express";

import { prisma } from "../../shared/database/prisma.js";
import { SNAPSHOT_EVENT } from "./events.interface.js";

const HEARTBEAT_MS = 30_000;

interface Subscriber {
  res: Response;
  heartbeat: NodeJS.Timeout;
}

const subscribers = new Map<string, Set<Subscriber>>();

const writeFrame = (res: Response, event: string, data: unknown): void => {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Connection already closed.
  }
};

const subscribe = (userId: string, res: Response): void => {
  const set = subscribers.get(userId) ?? new Set<Subscriber>();
  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      // Connection already closed.
    }
  }, HEARTBEAT_MS);

  const subscriber: Subscriber = { res, heartbeat };
  set.add(subscriber);
  subscribers.set(userId, set);

  res.on("close", () => {
    clearInterval(heartbeat);
    const current = subscribers.get(userId);
    current?.delete(subscriber);
    if (current && current.size === 0) {
      subscribers.delete(userId);
    }
  });
};

const broadcast = (userId: string, event: string, data: unknown): void => {
  const set = subscribers.get(userId);
  if (!set || set.size === 0) {
    return;
  }
  for (const subscriber of set) {
    writeFrame(subscriber.res, event, data);
  }
};

const publishSnapshot = async (userId: string, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) {
    return;
  }

  if (user.role === UserRole.DRIVER) {
    const pools = await prisma.pool.findMany({
      where: { driverId: userId, status: { in: [PoolStatus.FORMING, PoolStatus.ACTIVE] } },
      orderBy: { createdAt: "asc" },
      include: {
        memberships: {
          include: {
            rideRequest: { include: { passenger: true } },
          },
        },
      },
    });

    writeFrame(res, SNAPSHOT_EVENT, { pools });
    return;
  }

  const rides = await prisma.rideRequest.findMany({
    where: {
      passengerId: userId,
      status: {
        in: [RideStatus.REQUESTED, RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED],
      },
    },
    orderBy: { createdAt: "desc" },
    include: { poolMembership: { include: { pool: true } } },
  });

  writeFrame(res, SNAPSHOT_EVENT, { rides });
};

export const EventsService = {
  subscribe,
  broadcast,
  publishSnapshot,
};