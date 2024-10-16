import { useGapi } from "@/renderer/hooks/gapi";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "@blocknote/shadcn/style.css";
import { Button } from "../ui/button";
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems,
  } from "@blocknote/core";
  import {
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
    useCreateBlockNote,
  } from "@blocknote/react";
import { useTheme } from "@/renderer/Providers/ThemeProvider";

    const schema = BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
        },
    });

export const Editor = ({}: any) => {
    const {theme} : any = useTheme()
    const { id }: any = useParams()
    const { gapi }: any = useGapi()
    const [editableFile, setEditableFile]: any = useState(false)
    const editor = useCreateBlockNote({
        schema,
      });

    useEffect(() => {
        (async () =>{
            if(!gapi || !id)
                return
            try{
                const response = await gapi.client.drive.files.get({
                    'fileId': id,
                    alt:"media"
                });
                const blocks = await editor.tryParseMarkdownToBlocks(response.body);
                editor.replaceBlocks(editor.document, blocks);
                setEditableFile(true)
            }
            catch{
                setEditableFile(false)
            }
        })()
    },[id, editor])


    const save = async() =>{
        const markdownFromBlocks = await editor.blocksToMarkdownLossy(editor.document);

        await gapi.client.request({
            path: `/upload/drive/v3/files/${id}`,
            method: 'PATCH',
            params: {
                uploadType: "media",
                supportsAllDrives: true,
            },headers: {
            'Content-Type': 'text/markdown'
            },
            body: markdownFromBlocks
          })

    }
  return  editableFile? (<><BlockNoteView editor={editor} slashMenu={false} theme={theme}>
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query: any) =>
            filterSuggestionItems(
              [...getDefaultReactSlashMenuItems(editor)],
              query
            )
          }
        />
      </BlockNoteView>
    <div className="ml-auto mt-auto p-4 flex items-center gap-2">
        <Button onClick={() => save()}>Save</Button>
    </div>
  </>) : (<>
          <div
            className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Folder
              </h3>
              <p className="text-sm text-muted-foreground">
                Nothing to see here 😉
              </p>
            </div>
          </div></>)
}
