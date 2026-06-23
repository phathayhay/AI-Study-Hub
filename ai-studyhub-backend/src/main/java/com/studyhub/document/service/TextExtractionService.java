package com.studyhub.document.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.sl.extractor.SlideShowExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class TextExtractionService {

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        try (InputStream inputStream = file.getInputStream()) {
            return switch (extension) {
                case "pdf" -> extractTextFromPdf(inputStream);
                case "docx" -> extractTextFromDocx(inputStream);
                case "pptx" -> extractTextFromPptx(inputStream);
                case "txt" -> extractTextFromTxt(inputStream);
                default -> throw new IllegalArgumentException("Unsupported file type: " + extension);
            };
        }
    }

    public String extractTextFromUrl(String fileUrl) throws IOException {
        if (fileUrl == null || fileUrl.isEmpty()) {
            throw new IllegalArgumentException("Invalid file URL");
        }
        try {
            // Find the file extension from the URL (excluding query params)
            String cleanUrl = fileUrl.split("\\?")[0];
            String extension = cleanUrl.substring(cleanUrl.lastIndexOf(".") + 1).toLowerCase();

            log.info("Extracting text from URL: {}, detected extension: {}", fileUrl, extension);

            java.net.URL url = new java.net.URL(fileUrl);
            try (InputStream inputStream = url.openStream()) {
                return switch (extension) {
                    case "pdf" -> extractTextFromPdf(inputStream);
                    case "docx" -> extractTextFromDocx(inputStream);
                    case "pptx" -> extractTextFromPptx(inputStream);
                    case "txt" -> extractTextFromTxt(inputStream);
                    default -> throw new IllegalArgumentException("Unsupported file type: " + extension);
                };
            }
        } catch (Exception e) {
            log.error("Failed to extract text from URL {}: {}", fileUrl, e.getMessage());
            throw new IOException("Text extraction failed", e);
        }
    }

    public String extractTextFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            log.error("Failed to extract text from PDF: {}", e.getMessage());
            throw new IOException("Failed to parse PDF file", e);
        }
    }

    public String extractTextFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        } catch (Exception e) {
            log.error("Failed to extract text from Word document: {}", e.getMessage());
            throw new IOException("Failed to parse Word (.docx) file", e);
        }
    }

    public String extractTextFromTxt(InputStream inputStream) throws IOException {
        try {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to extract text from TXT: {}", e.getMessage());
            throw new IOException("Failed to parse Text file", e);
        }
    }

    public String extractTextFromPptx(InputStream inputStream) throws IOException {
        try (XMLSlideShow ppt = new XMLSlideShow(inputStream);
             SlideShowExtractor<?, ?> extractor = new SlideShowExtractor<>(ppt)) {
            extractor.setSlidesByDefault(true);
            extractor.setNotesByDefault(true);
            return extractor.getText();
        } catch (Exception e) {
            log.error("Failed to extract text from PPTX document: {}", e.getMessage());
            throw new IOException("Failed to parse PPTX file", e);
        }
    }
}
