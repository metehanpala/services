export class WsiError extends Error {

  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiError';
  }
}

export class WsiErrorConnectionFailed extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiConnectionFailedError';
  }
}

export class WsiErrorGrantFailed extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiGrantFailedError';
  }
}

export class WsiErrorTrendFailed extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiErrorTrendFailed';
  }
}

export class WsiErrorLicenseInvalid extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiLicenseInvalidError';
  }
}

export class WsiErrorCmdExecFailed extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiCmdExecFailedError';
  }
}

export class WsiErrorEvtCmdExecFailed extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiEvtCmdExecFailedError';
  }
}
export class WsiErrorPasswordExpired extends WsiError {
  constructor(message: string, public status?: number, public statusText?: string) {
    super(message);
    this.name = 'WsiErrorPasswordExpired';
  }
}
