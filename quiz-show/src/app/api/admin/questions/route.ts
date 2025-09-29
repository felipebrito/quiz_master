import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (themeId) where.theme_id = themeId;
    if (difficulty) where.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          theme: true
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, option_a, option_b, option_c, correct_answer, difficulty, theme_id } = body;

    if (!text || !option_a || !option_b || !option_c || !correct_answer) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['A', 'B', 'C'].includes(correct_answer)) {
      return NextResponse.json(
        { success: false, error: 'Correct answer must be A, B, or C' },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        text,
        option_a,
        option_b,
        option_c,
        correct_answer,
        difficulty: difficulty || 'medium',
        theme_id: theme_id || null
      },
      include: {
        theme: true
      }
    });

    return NextResponse.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
