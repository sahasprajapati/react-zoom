import ReactDOM, { Root } from "react-dom/client";
import { ZegoSuperBoardManager } from "zego-superboard-web";
import ZIM from "zego-zim-web";
import {
  ConsoleLevel,
  LiveRole,
  LiveStreamingMode,
  RightPanelExpandedType,
  ScenarioModel,
  VideoMixinOutputResolution,
  VideoResolution,
  ZegoCallInvitationConfig,
  ZegoCloudRoomConfig,
  ZegoInvitationType,
  ZegoSignalingPluginNotificationConfig,
  ZegoUser,
} from "./model/index";
import { ZegoCloudRTCCore } from "./modules/index";
import { generatePrebuiltToken, isPc } from "./util";
import { ZegoCloudRTCKitComponent } from "./view/index";
import { query, where } from "firebase/firestore";
import { meetingsRef } from "../utils/firebaseConfig";

export class ZegoUIKitPrebuilt {
  static core: ZegoCloudRTCCore | undefined;
  static _instance: ZegoUIKitPrebuilt;
  static Host = LiveRole.Host;
  static Cohost = LiveRole.Cohost;
  static Audience = LiveRole.Audience;

  static OneONoneCall = ScenarioModel.OneONoneCall;
  static GroupCall = ScenarioModel.GroupCall;
  static LiveStreaming = ScenarioModel.LiveStreaming;
  static VideoConference = ScenarioModel.VideoConference;
  static VideoResolution_180P = VideoResolution._180P;
  static VideoResolution_360P = VideoResolution._360P;
  static VideoResolution_480P = VideoResolution._480P;
  static VideoResolution_720P = VideoResolution._720P;
  static LiveStreamingMode = LiveStreamingMode;
  static InvitationTypeVoiceCall = ZegoInvitationType.VoiceCall;
  static InvitationTypeVideoCall = ZegoInvitationType.VideoCall;
  static ConsoleDebug = ConsoleLevel.Debug;
  static ConsoleInfo = ConsoleLevel.Info;
  static ConsoleWarning = ConsoleLevel.Warning;
  static ConsoleError = ConsoleLevel.Error;
  static ConsoleNone = ConsoleLevel.None;
  static VideoMixinOutputResolution = VideoMixinOutputResolution;
  static RightPanelExpandedType = RightPanelExpandedType;
  private hasJoinedRoom = false;
  root: Root | undefined;

  static generateKitTokenForTest(
    appID: number,
    serverSecret: string,
    roomID: string,
    userID: string,
    userName?: string,
    ExpirationSeconds?: number
  ) {
    return generatePrebuiltToken(
      appID,
      serverSecret,
      roomID,
      userID,
      userName,
      ExpirationSeconds
    );
  }

  static generateKitTokenForProduction(
    appID: number,
    token: string,
    roomID: string,
    userID: string,
    userName?: string
  ) {
    return (
      token +
      "#" +
      window.btoa(
        JSON.stringify({
          userID,
          roomID,
          userName: encodeURIComponent(userName || ""),
          appID,
        })
      )
    );
  }

  static create(kitToken: string): ZegoUIKitPrebuilt {
    if (!ZegoUIKitPrebuilt.core && kitToken) {
      ZegoUIKitPrebuilt.core = ZegoCloudRTCCore.getInstance(kitToken);
      ZegoUIKitPrebuilt._instance = new ZegoUIKitPrebuilt();
    }
    return ZegoUIKitPrebuilt._instance;
  }

  addPlugins(plugins?: {
    ZegoSuperBoardManager?: typeof ZegoSuperBoardManager;
    ZIM?: typeof ZIM;
  }) {
    // @ts-ignore
    ZegoUIKitPrebuilt.core?.addPlugins(plugins);
    if (ZegoUIKitPrebuilt.core?._zimManager) {
      ZegoUIKitPrebuilt.core?._zimManager.notifyJoinRoom(
        (
          type: ZegoInvitationType,
          config: ZegoCloudRoomConfig,
          mode: ScenarioModel
        ) => {
          console.warn("notifyJoinRoom", type, config);
          if (config.autoLeaveRoomWhenOnlySelfInRoom === undefined) {
            config.autoLeaveRoomWhenOnlySelfInRoom =
              mode === ScenarioModel.OneONoneCall;
          }
          config.turnOnMicrophoneWhenJoining =
            config.turnOnCameraWhenJoining ?? true;
          if (type === ZegoInvitationType.VoiceCall) {
            config.turnOnCameraWhenJoining =
              config.turnOnCameraWhenJoining ?? false;
          }
          if (type === ZegoInvitationType.VideoCall) {
            config.turnOnCameraWhenJoining =
              config.turnOnCameraWhenJoining ?? true;
          }
          //   ZegoCloudRoomConfig部分参数不允许自定义
          let roomConfig = Object.assign(config, {
            showPreJoinView: false,
            showLeavingView: false,
            sharedLinks: [],
            scenario: {
              mode: mode,
            },
          }) as ZegoCloudRoomConfig;
          ZegoUIKitPrebuilt!.core!.status = {
            loginRsp: false,
            videoRefuse: undefined,
            audioRefuse: undefined,
          };
          this.joinRoom(roomConfig);
        }
      );
    }
  }

  joinRoom(roomConfig?: ZegoCloudRoomConfig) {
    if (!ZegoUIKitPrebuilt.core) {
      console.error("【ZEGOCLOUD】 please call init first !!");
      return;
    }
    if (this.hasJoinedRoom) {
      console.error("【ZEGOCLOUD】joinRoom repeat !!");
      return;
    }
    let div: any;
    if (!roomConfig || !roomConfig.container) {
      console.warn("【ZEGOCLOUD】joinRoom/roomConfig/container required !!");
      div = document.createElement("div");
      div.style.position = "fixed";
      div.style.width = "100%";
      div.style.height = isPc() ? "100vh" : "100%";
      div.style.minWidth = "345px";
      div.style.top = "0px";
      div.style.left = "0px";
      div.style.zIndex = "100";
      div.style.backgroundColor = "#FFFFFF";
      div.style.overflow = "auto";
      document.body.appendChild(div);
      roomConfig = {
        ...roomConfig,
        ...{
          container: div,
        },
      };
    }

    const result = ZegoUIKitPrebuilt.core.setConfig(roomConfig);
    if (result) {
      this.root = ReactDOM.createRoot(roomConfig.container as HTMLDivElement);
      this.root.render(
        <ZegoCloudRTCKitComponent
          core={ZegoUIKitPrebuilt.core}
          unmount={() => {
            // 单纯的销毁渲染的节点，不会销毁实例
            this.root?.unmount();
            this.root = undefined;
            this.hasJoinedRoom = false;
            div && div.remove();
          }}
        ></ZegoCloudRTCKitComponent>
      );
      this.hasJoinedRoom = true;
    } else {
      console.error("【ZEGOCLOUD】joinRoom parameter error !!");
    }
  }

  destroy() {
    ZegoUIKitPrebuilt.core?.leaveRoom?.();
    ZegoUIKitPrebuilt.core = undefined;
    // @ts-ignore
    ZegoCloudRTCCore._instance = undefined;
    this.root?.unmount?.();
    this.root = undefined;
    this.hasJoinedRoom = false;
  }
  setCallInvitationConfig(config?: ZegoCallInvitationConfig): void {
    if (!ZegoUIKitPrebuilt.core?._zimManager) {
      console.error("【ZEGOCLOUD】Please add ZIM plugin first");
      return;
    }
    if (!config) return;
    ZegoUIKitPrebuilt.core?._zimManager.setCallInvitationConfig(config);
  }
  // 发起邀请
  async sendCallInvitation(params: {
    callees: ZegoUser[];
    callType: ZegoInvitationType;
    timeout?: number;
    data?: string;
    notificationConfig?: ZegoSignalingPluginNotificationConfig;
  }): Promise<{ errorInvitees: ZegoUser[] }> {
    if (!ZegoUIKitPrebuilt.core?._zimManager) {
      console.error("【ZEGOCLOUD】Please add ZIM plugin first");
      return Promise.reject("ZEGOCLOUD】Please add ZIM plugin first");
    }
    const {
      callees,
      callType,
      timeout = 60,
      data = "",
      notificationConfig,
    } = params;
    if (!Array.isArray(callees) || callees.length < 1) {
      return Promise.reject(
        "【ZEGOCLOUD】sendCallInvitation params error: callees !!"
      );
    } else if (callees.length > 9) {
      return Promise.reject("【ZEGOCLOUD】Maximum number of users exceeded");
    }
    if (
      callType !== ZegoInvitationType.VideoCall &&
      callType !== ZegoInvitationType.VoiceCall
    ) {
      return Promise.reject(
        "【ZEGOCLOUD】sendCallInvitation params error: callType !!"
      );
    }

    return ZegoUIKitPrebuilt.core._zimManager.sendInvitation(
      callees,
      callType,
      timeout,
      data,
      notificationConfig
    );
  }

  async sendInRoomCommand(
    command: string,
    toUserIDs: string[]
  ): Promise<boolean> {
    return await ZegoUIKitPrebuilt.core!.sendInRoomCommand(command, toUserIDs);
  }
  // 主动退出房间
  hangUp() {
    ZegoUIKitPrebuilt.core?.eventEmitter.emit("hangUp");
  }
}
