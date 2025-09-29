import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: themes
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        description,
        color: color || '#3B82F6'
      }
    });

    return NextResponse.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create theme' },
      { status: 500 }
    );
  }
}
