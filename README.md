# Batch Download Manager

A cross platform desktop batch download manager built using Angular and Electron, designed to demonstrate seamless integration of modern web application technologies within a native desktop environment.

This project showcases how a rich Angular frontend can communicate directly with a desktop application layer through Electron’s IPC system to perform filesystem and network operations that are not possible in a standard browser environment.

---

## Overview

Batch Download Manager is a desktop application that allows users to manage and execute multiple download tasks efficiently from a single interface. The application combines Angular’s component driven UI architecture with Electron’s native system access to bridge the gap between web development and desktop application capabilities.

The project is intentionally structured to highlight how frontend focused technologies can be extended into fully functional desktop applications without sacrificing architectural clarity or maintainability.

---

## Key Features

- Batch based download management
- Desktop application built with web technologies
- Angular driven user interface
- Electron wrapper for native system access
- Inter process communication between UI and application layer
- File system and network operations outside browser limitations
- Clean and responsive UI design
- Scalable architecture suitable for feature expansion

---

## Architecture

### Angular Frontend Application

The user interface is built entirely with Angular, leveraging its component driven model to manage application state, user interaction, and visual presentation. The UI layer is responsible for:

- Defining download tasks
- Managing user input and validation
- Displaying download progress and status
- Coordinating actions with the Electron backend

Angular provides a structured and maintainable foundation while remaining framework agnostic to the underlying desktop environment.

---

### Electron Desktop Integration

Electron is used to package the Angular application as a native desktop application. It provides access to system level capabilities such as filesystem operations and network requests that are not available in a standard browser context.

Electron enables:
- Native desktop execution
- Cross platform compatibility
- Secure separation between UI and system level logic

---

### IPC Based Communication

A key focus of this project is the use of Electron’s inter process communication system to enable safe and controlled interaction between the Angular frontend and the Electron application layer.

IPC is used to:
- Send download requests from the UI to the application layer
- Execute background download operations
- Report progress and status updates back to the UI
- Maintain a clear boundary between presentation logic and system operations

This approach ensures a clean separation of concerns while allowing complex desktop functionality to be driven from a web based interface.

---

## Design Philosophy

The project is designed to demonstrate how modern frontend engineering skills translate directly into desktop application development. By keeping UI logic, system access, and communication layers clearly defined, the application remains easy to reason about, extend, and maintain.

This architecture also allows the UI to be reused or repurposed independently of the Electron wrapper if needed.

---

## Technologies Used

- Angular
- TypeScript
- Electron
- Inter Process Communication
- HTML and CSS
- Desktop application packaging with web technologies

---

## Use Case

Batch Download Manager serves as both a functional utility and a technical showcase, highlighting the ability to:

- Build desktop applications using web frameworks
- Integrate frontend and backend concerns in a desktop context
- Safely bridge browser based UIs with native system capabilities
- Architect scalable, maintainable cross platform applications

---

## Notes

- Download execution and filesystem access are handled outside the browser context via Electron.
- The application architecture emphasizes clarity and separation of responsibilities.
- Designed as a demonstration of engineering capability rather than a production download manager.

---

## Author

Developed as part of a professional software engineering portfolio to demonstrate cross platform desktop application development, Electron and Angular integration, and IPC driven system architecture.
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
