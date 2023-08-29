import * as vscode from "vscode";

import {VirtualMachineProvider} from "../virtual_machine";
import {CommandsFlags, TelemetryEventIds} from "../../constants/flags";
import {ParallelsDesktopService} from "../../services/parallelsDesktopService";
import {Provider} from "../../ioc/provider";
import {LogService} from "../../services/logService";

export function registerStartHeadlessVirtualMachineCommand(
  context: vscode.ExtensionContext,
  provider: VirtualMachineProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(CommandsFlags.treeStartHeadlessVm, async item => {
      if (!item) {
        return;
      }
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Starting virtual machine ${item.name}`
        },
        async () => {
          // refreshing the vm state in the config
          const config = Provider.getConfiguration();
          config.setVmStatus(item.id, "starting...");
          provider.refresh();

          let foundError = false;
          const ok = await ParallelsDesktopService.startHeadlessVm(item.id).catch(reject => {
            vscode.window.showErrorMessage(`${reject}`);
            foundError = true;
            return;
          });
          if (!ok || foundError) {
            vscode.window.showErrorMessage(`Failed to start headless virtual machine ${item.name}`);
            return;
          }

          // awaiting for the status to be reported
          let retry = 40;
          while (true) {
            provider.refresh();
            const result = await ParallelsDesktopService.getVmStatus(item.id);
            if (result === "running") {
              LogService.info(`Virtual machine ${item.name} started`, "StartHeadlessVirtualMachineCommand");
              LogService.sendTelemetryEvent(
                TelemetryEventIds.VirtualMachineAction,
                `Virtual machine ${item.name} started`
              );

              break;
            }
            if (retry === 0) {
              LogService.error(`Virtual machine ${item.name} failed to start`, "StartHeadlessVirtualMachineCommand");
              LogService.sendTelemetryEvent(
                TelemetryEventIds.VirtualMachineAction,
                `Virtual machine ${item.name} failed to start`
              );
              vscode.window.showErrorMessage(
                `Failed to check if the machine ${item.name} started, please check the logs`
              );
              break;
            }
            retry--;
          }

          vscode.commands.executeCommand(CommandsFlags.treeRefreshVms);
        }
      );
    })
  );
}
