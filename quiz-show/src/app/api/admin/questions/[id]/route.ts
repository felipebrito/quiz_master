import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        theme: true
      }
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch question' },
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

    const question = await prisma.question.update({
      where: { id: params.id },
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
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if question is used in any rounds
    const questionWithRounds = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { rounds: true, answers: true }
        }
      }
    });

    if (!questionWithRounds) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    if (questionWithRounds._count.rounds > 0 || questionWithRounds._count.answers > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete question that has been used in games' },
        { status: 400 }
      );
    }

    await prisma.question.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
