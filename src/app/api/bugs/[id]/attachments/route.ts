import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const bugId = Number(params.id);
    if (isNaN(bugId)) {
      return NextResponse.json({ error: 'Invalid Bug ID' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadedById = formData.get('uploadedById') as string;

    if (!file || !uploadedById) {
      return NextResponse.json({ error: 'Missing file or uploadedById' }, { status: 400 });
    }

    // Read file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save file
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFilename}`;

    // Save attachment in database
    const attachment = await prisma.attachment.create({
      data: {
        bugId,
        filename: file.name,
        url: relativeUrl,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        bugId,
        field: 'attachment',
        newValue: `Added attachment "${file.name}"`,
        changedById: uploadedById,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
