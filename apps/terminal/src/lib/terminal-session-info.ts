/**
 * Live shell session metadata sent by the server as a SESSION_INFO xumux frame
 * on channel open. Fields match the JSON payload encoded by encodeSessionInfo.
 */
export interface TerminalSessionInfo {
  shell: string;
  shellName: string;
  pid: number;
  cwd: string;
}
