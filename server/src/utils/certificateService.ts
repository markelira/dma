import puppeteer from 'puppeteer'
import QRCode from 'qrcode'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'
import logger from './logger'
import notificationService from './notificationService'

const prisma = new PrismaClient()

interface CertificateData {
  userId: string
  courseId: string
  studentName: string
  courseTitle: string
  completionDate: Date
  instructorName: string
}

interface CertificateValidationResult {
  isValid: boolean
  certificate?: {
    id: string
    studentName: string
    courseTitle: string
    issuedAt: Date
    instructorName: string
  }
  error?: string
}

class CertificateService {
  private certificatesDir: string

  constructor() {
    this.certificatesDir = path.join(__dirname, '../../certificates')
    this.ensureCertificatesDirectory()
  }

  private async ensureCertificatesDirectory(): Promise<void> {
    try {
      await fs.access(this.certificatesDir)
    } catch {
      await fs.mkdir(this.certificatesDir, { recursive: true })
    }
  }

  private async generateQRCode(certificateId: string): Promise<string> {
    const validationUrl = `${process.env.CLIENT_URL}/certificates/validate/${certificateId}`
    return await QRCode.toDataURL(validationUrl)
  }

  private generateCertificateHTML(data: CertificateData, qrCodeDataUrl: string, certificateId: string): string {
    return `
    <!DOCTYPE html>
    <html lang="hu">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tanúsítvány</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .certificate {
                background: white;
                width: 800px;
                height: 600px;
                border: 10px solid #2c3e50;
                border-radius: 15px;
                position: relative;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 60px 40px;
            }
            
            .certificate::before {
                content: '';
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                border: 3px solid #3498db;
                border-radius: 8px;
            }
            
            .header {
                margin-bottom: 30px;
            }
            
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .title {
                font-size: 48px;
                color: #2c3e50;
                margin-bottom: 20px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 3px;
            }
            
            .subtitle {
                font-size: 18px;
                color: #7f8c8d;
                margin-bottom: 40px;
            }
            
            .content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .recipient {
                font-size: 36px;
                color: #e74c3c;
                margin-bottom: 30px;
                font-weight: bold;
                border-bottom: 3px solid #e74c3c;
                padding-bottom: 10px;
            }
            
            .course-title {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 30px;
                font-style: italic;
            }
            
            .completion-text {
                font-size: 16px;
                color: #7f8c8d;
                margin-bottom: 40px;
                line-height: 1.6;
            }
            
            .footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                width: 100%;
                margin-top: 40px;
            }
            
            .signature {
                text-align: center;
            }
            
            .signature-line {
                width: 200px;
                height: 2px;
                background: #bdc3c7;
                margin-bottom: 5px;
            }
            
            .instructor-name {
                font-size: 16px;
                color: #2c3e50;
                font-weight: bold;
            }
            
            .instructor-title {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .qr-section {
                text-align: center;
            }
            
            .qr-code {
                width: 80px;
                height: 80px;
                margin-bottom: 5px;
            }
            
            .certificate-id {
                font-size: 10px;
                color: #bdc3c7;
            }
            
            .date {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #7f8c8d;
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="header">
                <div class="logo">DMA</div>
                <div class="title">Tanúsítvány</div>
                <div class="subtitle">Certificate of Completion</div>
            </div>
            
            <div class="content">
                <div class="recipient">${data.studentName}</div>
                <div class="completion-text">
                    sikeresen teljesítette a következő kurzust:<br>
                    <strong>has successfully completed the course:</strong>
                </div>
                <div class="course-title">"${data.courseTitle}"</div>
            </div>
            
            <div class="footer">
                <div class="signature">
                    <div class="signature-line"></div>
                    <div class="instructor-name">${data.instructorName}</div>
                    <div class="instructor-title">Kurzus Instruktor / Course Instructor</div>
                </div>
                
                <div class="qr-section">
                    <img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code">
                    <div class="certificate-id">ID: ${certificateId}</div>
                </div>
            </div>
            
            <div class="date">
                Kiállítva / Issued: ${data.completionDate.toLocaleDateString('hu-HU')}
            </div>
        </div>
    </body>
    </html>
    `
  }

  async generateCertificate(userId: string, courseId: string): Promise<string> {
    try {
      // Check if certificate already exists
      const existingCertificate = await prisma.certificate.findFirst({
        where: { userId }
      })

      if (existingCertificate) {
        throw new Error('Certificate already exists for this user and course')
      }

      // Verify course completion
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: true,
          modules: {
            include: {
              lessons: true
            }
          }
        }
      })

      if (!course) {
        throw new Error('Course not found')
      }

      // Get all lessons in the course
      const allLessons = course.modules.flatMap(module => module.lessons)
      const lessonIds = allLessons.map(lesson => lesson.id)

      // Check completion status
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          completed: true
        }
      })

      if (completedLessons < allLessons.length) {
        throw new Error('Course not fully completed')
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create certificate record
      const certificate = await prisma.certificate.create({
        data: {
          userId,
          courseName: course.title,
        }
      })

      // Prepare certificate data
      const certificateData: CertificateData = {
        userId,
        courseId,
        studentName: `${user.firstName} ${user.lastName}`,
        courseTitle: course.title,
        completionDate: new Date(),
        instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`
      }

      // Generate QR code
      const qrCodeDataUrl = await this.generateQRCode(certificate.id)

      // Generate HTML
      const html = this.generateCertificateHTML(certificateData, qrCodeDataUrl, certificate.id)

      // Generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const fileName = `certificate-${certificate.id}.pdf`
      const filePath = path.join(this.certificatesDir, fileName)

      await page.pdf({
        path: filePath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      await browser.close()

      // Update certificate with URL
      const certificateUrl = `/certificates/${fileName}`
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { courseName: course.title }
      })

      // Send notification
      await notificationService.notifyCertificateIssued(userId, course.title)

      logger.info(`Certificate generated successfully for user ${userId}, course ${courseId}`)
      return certificateUrl

    } catch (error) {
      logger.error(`Failed to generate certificate: ${error}`)
      throw error
    }
  }

  async validateCertificate(certificateId: string): Promise<CertificateValidationResult> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      })

      if (!certificate) {
        return {
          isValid: false,
          error: 'Certificate not found'
        }
      }

      return {
        isValid: true,
        certificate: {
          id: certificate.id,
          studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,
          courseTitle: certificate.courseName,
          issuedAt: certificate.issueDate,
          instructorName: 'Instructor Name' // Default since we don't have course relation
        }
      }
    } catch (error) {
      logger.error(`Failed to validate certificate: ${error}`)
      return {
        isValid: false,
        error: 'Validation failed'
      }
    }
  }

  async getUserCertificates(userId: string) {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { userId },
        orderBy: { issueDate: 'desc' }
      })

      return certificates.map(cert => ({
        id: cert.id,
        courseId: 'course-id', // Default since we don't have course relation
        courseTitle: cert.courseName,
        instructorName: 'Instructor Name', // Default since we don't have course relation
        issuedAt: cert.issueDate,
        downloadUrl: `/certificates/certificate-${cert.id}.pdf`
      }))
    } catch (error) {
      logger.error(`Failed to get user certificates: ${error}`)
      throw error
    }
  }
}

export const certificateService = new CertificateService()
export default certificateService 