import prisma from "../../../../lib/prisma";

export async function DELETE(req) {
  try {
    const { accessoryId } = await req.json();

    if (!accessoryId) {
      return new Response(JSON.stringify({ error: "Accessory ID is required" }), {
        status: 400,
      });
    }

    await prisma.$transaction([
      prisma.userAccessoires.deleteMany({ where: { accessorieid: accessoryId } }),
      prisma.accessories.delete({ where: { accessorieid: accessoryId } }),
    ]);

    return new Response(
      JSON.stringify({ message: "Accessory deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting accessory:", error);
    return new Response(JSON.stringify({ error: "Error deleting accessory" }), {
      status: 500,
    });
  }
}
