import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = await prisma.gameConfig.findUnique({
      where: { id: params.id }
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Game config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching game config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game config' },
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
    const { name, description, rounds_count, round_duration, question_duration, is_active } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const config = await prisma.gameConfig.update({
      where: { id: params.id },
      data: {
        name,
        description,
        rounds_count: rounds_count || 5,
        round_duration: round_duration || 30,
        question_duration: question_duration || 15,
        is_active: is_active !== undefined ? is_active : true
      }
    });

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error updating game config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update game config' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if config is used in any games
    const configWithGames = await prisma.gameConfig.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { games: true }
        }
      }
    });

    if (!configWithGames) {
      return NextResponse.json(
        { success: false, error: 'Game config not found' },
        { status: 404 }
      );
    }

    if (configWithGames._count.games > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete config that has been used in games' },
        { status: 400 }
      );
    }

    await prisma.gameConfig.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Game config deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting game config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete game config' },
      { status: 500 }
    );
  }
}
