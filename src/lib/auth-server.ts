import "server-only";

import { getAdminAuthInstance } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function getUserFromToken(token: string) {
  const decoded = await getAdminAuthInstance().verifyIdToken(token, true);
  const uid = decoded.uid;
  const email = decoded.email ?? "";
  const phone = decoded.phone_number ?? "";

  let user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { firebaseUid: uid, email, phone },
    });
  } else if (phone && !user.phone) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phone },
    });
  }

  return user;
}
