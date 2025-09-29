import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const configs = await prisma.gameConfig.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { games: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching game configs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game configs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, rounds_count, round_duration, question_duration } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const config = await prisma.gameConfig.create({
      data: {
        name,
        description,
        rounds_count: rounds_count || 5,
        round_duration: round_duration || 30,
        question_duration: question_duration || 15
      }
    });

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error creating game config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game config' },
      { status: 500 }
    );
  }
}
