# Description

This project is a public website available at https://jjsantos01.github.io/random-exams that allows to generate random exams for students. The user needs
to load an Excel file containing questions and posible options, and the program will generate 3 PDF files:
1. A PDF file with the exams for each student with the questions in random order.
2. A PDF file with the bubble sheet for student to mark their answer.
3. A PDF with the correct answers to ease the evaluation process.

You need to provide an Excel file with the following structure:

| Question 1 | option 1 (answer) | option 2 | option 3 | option 4 |
|------------|------------------|----------|----------|----------|
| Question 2 | option 1 (answer) | option 2 | option 3 | option 4 |
| Question 3 | option 1 (answer) | option 2 | option 3 | option 4 |
...

The first column contains the questions, and the other columns contain the options. The correct answer should be always the first option.

In the [example](/example/) folder you can find an example of the Excel file that you need to provide and the generated PDF files.
