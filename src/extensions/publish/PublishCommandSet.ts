/* eslint-disable no-debugger */
import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import { Dialog } from '@microsoft/sp-dialog';
import { spfi, SPFx } from '@pnp/sp/presets/all';
import { SPPermission } from '@microsoft/sp-page-context';
// import { LogLevel, PnPLogging } from "@pnp/logging";

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IPublishCommandSetProperties {

}

const LOG_SOURCE: string = 'PublishCommandSet';
const PUBLISH_COMMAND: string = 'SWIFT_PUBLISH';

export default class PublishCommandSet extends BaseListViewCommandSet<IPublishCommandSetProperties> {

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized PublishCommandSet');
    
    const publishAllCommand: Command = this.tryGetCommand(PUBLISH_COMMAND);
    publishAllCommand.visible = false;

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);

    return Promise.resolve();
  }

  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> 
  {
      // todo: find a way to update the title in the dialog box (instead of showing 'prompt')
      const comment = await Dialog.prompt(`Comments`);
      
      // need this to get the current context so we can get access to the files and publish them
      const sp = spfi().using(SPFx(this.context));

      // Get the selected items that are in Draft status
      // Since the publish method uses getFileByServerRelativePath method, we need to get the file by the FileRef
      const itemIds = event.selectedRows
        .filter(i => i.getValueByName("_ModerationStatus") === "Draft")
        .map(i => i.getValueByName("FileRef"));
      
      // Publish the selected items
      await Promise.all(itemIds.map(async (itemId) => {
        const file = await sp.web.getFileByServerRelativePath(itemId);
        if (file !== null) {
          try {
            await file.publish(comment);
          } catch (error) {
            console.error(error);
          }
        }
      }));

      return Promise.resolve();
  }



  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    //todo: implement the logic to show/hide the command when the minor versioning is enabled
    
    // Check if the user has permission to approve items
    const hasPermission = this.context.pageContext.list?.permissions.hasPermission(SPPermission.approveItems) ?? false;
    
    // Check if there are more than 1 selected rows
    const selectedRows = this.context.listView.selectedRows?.length ?? 0;
    const publishAllCommand: Command = this.tryGetCommand(PUBLISH_COMMAND);
    
    // Show the command only if the user has permission and there are more than 1 selected rows
    publishAllCommand.visible = hasPermission && selectedRows > 1;
    
    // You should call this.raiseOnChage() to update the command bar
    this.raiseOnChange();
  }
}

