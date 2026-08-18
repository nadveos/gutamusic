import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { VideoUploadClient } from './VideoUploadClient';

export const metadata = {
  title: 'Carga de Videos | GUTA CMS',
};

export default async function AdminVideosPage() {
  const videos = await MusicDataService.getVideos();
  const artists = await MusicDataService.getArtists();

  return <VideoUploadClient initialVideos={videos} artists={artists} />;
}
