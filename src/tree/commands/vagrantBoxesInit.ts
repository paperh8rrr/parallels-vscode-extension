import * as vscode from "vscode";

import {CommandsFlags} from "../../constants/flags";
import {VagrantBoxProvider} from "../vagrant_boxes";
import {VagrantBoxTreeItem} from "../vagrant_box_item";
import {VagrantService} from "../../services/vagrantService";

export function registerVagrantBoxInitCommand(context: vscode.ExtensionContext, provider: VagrantBoxProvider) {
  context.subscriptions.push(
    vscode.commands.registerCommand(CommandsFlags.vagrantBoxProviderInit, async (item: VagrantBoxTreeItem) => {
      if (item.name !== "") {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Initializing Vagrant box ${item.name}`
          },
          async progress => {
            await VagrantService.init(item.name, context)
              .then(
                value => {
                  if (!value) {
                    vscode.window.showErrorMessage(`Error initializing Vagrant box ${item.name}`);
                  }
                  vscode.commands.executeCommand(CommandsFlags.treeViewRefreshVms);
                },
                reason => {
                  vscode.window.showErrorMessage(
                    `Error initializing Vagrant box ${item.name}: vagrant exited with code ${reason}`
                  );
                }
              )
              .catch(reason => {
                vscode.window.showErrorMessage(
                  `Error initializing Vagrant box ${item.name}: vagrant exited with code ${reason}`
                );
              });
          }
        );
      }
    })
  );
}
