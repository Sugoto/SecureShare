import { useEffect, useState } from "react";
import { useFileStore } from "../store/fileStore";
import { fileService } from "../services/fileService";
import { ShareModal } from "./ShareModal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Download, Share2, Trash2 } from "lucide-react";

export const FileList = () => {
  const { ownedFiles, sharedFiles, fetchFiles, deleteFile, isLoading, error } =
    useFileStore();
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [shareFileId, setShareFileId] = useState<number | null>(null);
  const [shareFileName, setShareFileName] = useState("");

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const FileRow = ({
    file,
    isOwned,
  }: {
    file: {
      id: number;
      filename: string;
      file_path: string;
      user_id: number;
      owner_username?: string;
    };
    isOwned: boolean;
  }) => {
    const [downloadPassword, setDownloadPassword] = useState("");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = currentUser.role === "admin";

    const handleLocalDownload = async () => {
      try {
        const blob = await fileService.downloadFile(file.id, downloadPassword);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setDownloadPassword("");
        setSelectedFileId(null);
      } catch (err) {
        console.error("Download failed:", err);
      }
    };

    return (
      <div className="flex items-center justify-between p-4 border-b last:border-b-0">
        <div className="flex items-center gap-4">
          <span className="text-sm">{file.filename}</span>
          {isAdmin && file.owner_username && (
            <span className="text-xs text-muted-foreground">
              Owned by {file.owner_username}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selectedFileId === file.id ? (
            <div className="flex gap-2">
              <Input
                type="password"
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
                placeholder="Enter password"
                className="w-40"
              />
              <Button size="sm" variant="default" onClick={handleLocalDownload}>
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedFileId(null);
                  setDownloadPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFileId(file.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {isOwned && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShareFileId(file.id);
                    setShareFileName(file.filename);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteFile(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {ownedFiles.map((file) => (
            <FileRow key={file.id} file={file} isOwned={true} />
          ))}
          {ownedFiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No files uploaded yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shared With You</CardTitle>
        </CardHeader>
        <CardContent>
          {sharedFiles.map((file) => (
            <FileRow key={file.id} file={file} isOwned={false} />
          ))}
          {sharedFiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No files shared with you
            </p>
          )}
        </CardContent>
      </Card>

      {shareFileId && (
        <ShareModal
          fileId={shareFileId}
          fileName={shareFileName}
          onClose={() => setShareFileId(null)}
        />
      )}
    </div>
  );
};
