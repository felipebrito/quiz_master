import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const theme = await prisma.theme.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!theme) {
      return NextResponse.json(
        { success: false, error: 'Theme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch theme' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const theme = await prisma.theme.update({
      where: { id: params.id },
      data: {
        name,
        description,
        color
      }
    });

    return NextResponse.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if theme has questions
    const themeWithQuestions = await prisma.theme.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!themeWithQuestions) {
      return NextResponse.json(
        { success: false, error: 'Theme not found' },
        { status: 404 }
      );
    }

    if (themeWithQuestions._count.questions > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete theme with questions. Please delete questions first.' },
        { status: 400 }
      );
    }

    await prisma.theme.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Theme deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete theme' },
      { status: 500 }
    );
  }
}
