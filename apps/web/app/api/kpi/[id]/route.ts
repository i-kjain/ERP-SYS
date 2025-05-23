import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

/**
 * GET function to fetch a specific KPI by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    const kpi_id = Number(id);

    const kpi = await prisma.kpi.findUnique({
      where: { kpi_id }
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // Return KPI with transformed structure for frontend
    // Instead of including both form_data and elements, only include elements
    const responseKpi = {
      kpi_id: kpi.kpi_id,
      kpi_name: kpi.kpi_name,
      kpi_created_at: kpi.kpi_created_at,
      kpi_updated_at: kpi.kpi_updated_at,
      id: kpi.kpi_name,
      elements: kpi.form_data
    };

    return NextResponse.json({ success: true, kpi: responseKpi });
  } catch (error) {
    console.error('Error fetching KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI' },
      { status: 500 }
    );
  }
}

/**
 * PUT function to update a KPI.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    const kpi_id = Number(id);
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { elements, updatedAt } = body;

    // Check if elements are provided
    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json(
        { success: false, error: 'Form elements are required and must be an array' },
        { status: 400 }
      );
    }

    // Check if KPI exists
    const existingKpi = await prisma.kpi.findUnique({
      where: { kpi_id }
    });

    if (!existingKpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }

    // Update KPI - keep the same kpi_name but update form_data with new elements
    const updatedKpi = await prisma.kpi.update({
      where: { kpi_id },
      data: {
        form_data: elements,
        kpi_updated_at: updatedAt ? new Date(updatedAt) : new Date()
      }
    });

    // Return updated KPI with transformed structure (avoid duplication)
    return NextResponse.json({ 
      success: true, 
      message: 'KPI updated successfully', 
      kpi: {
        kpi_id: updatedKpi.kpi_id,
        kpi_name: updatedKpi.kpi_name,
        kpi_created_at: updatedKpi.kpi_created_at,
        kpi_updated_at: updatedKpi.kpi_updated_at,
        id: updatedKpi.kpi_name,
        elements: updatedKpi.form_data
      }
    });
  } catch (error) {
    console.error('Error updating KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update KPI' },
      { status: 500 }
    );
  }
}

/**
 * DELETE function to delete a KPI.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    const kpi_id = Number(id);

    // Check if KPI exists
    const existingKpi = await prisma.kpi.findUnique({
      where: { kpi_id }
    });

    if (!existingKpi) {
      return NextResponse.json(
        { success: false, error: 'KPI not found' },
        { status: 404 }
      );
    }
    
    // Check if KPI is in use by any assigned_kpi
    const assignedKpis = await prisma.assigned_kpi.findMany({
      where: { kpi_name: existingKpi.kpi_name },
      take: 1 // We only need to know if there's at least one
    });
    
    if (assignedKpis.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete KPI that is in use. Remove all assigned instances first.' },
        { status: 400 }
      );
    }

    // Delete KPI
    await prisma.kpi.delete({
      where: { kpi_id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'KPI deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete KPI' },
      { status: 500 }
    );
  }
}