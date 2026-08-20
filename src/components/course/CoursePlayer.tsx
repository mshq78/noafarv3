import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Plus,
  FileVideo,
  Settings,
  Sparkles,
  Award,
  Clock,
  Check,
  X,
  Radio,
  Shield,
} from 'lucide-react';
import { Course, CourseLesson } from '../../types';
import { ProgressBar, Button, Chip } from '../ui';
import { updateCourseProgress, updateCourseVideo, addCourseLesson } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { formatMinutes, toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';

interface CoursePlayerProps {
  course: Course;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course }) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'operator');
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lesson & Progress State
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(course.myProgressPercent || 0);

  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(course.durationSeconds || 1800);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Upload / Edit Video Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [videoInputUrl, setVideoInputUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [tempVideoBlobUrl, setTempVideoBlobUrl] = useState('');

  // Add Lesson Form State
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonMinutes, setNewLessonMinutes] = useState(15);
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  // Active Lesson
  const lessons = course.syllabus && course.syllabus.length > 0
    ? course.syllabus
    : [
        {
          id: 'les-default-1',
          title: course.title,
          durationMinutes: course.durationMinutes || Math.round((course.durationSeconds || 1800) / 60),
          videoUrl: course.videoUrl,
        },
      ];

  const currentLesson = lessons[activeLessonIndex] || lessons[0];
  const activeVideoUrl = currentLesson.videoUrl || course.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const isEmbed =
    activeVideoUrl.includes('aparat.com') ||
    activeVideoUrl.includes('youtube.com') ||
    activeVideoUrl.includes('youtu.be') ||
    activeVideoUrl.includes('vimeo.com');

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '۰۰:۰۰';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const mStr = m < 10 ? `۰${m}` : toFaDigits(m);
    const sStr = s < 10 ? `۰${s}` : toFaDigits(s);
    return `${mStr}:${sStr}`;
  };

  // Video Event Handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Lesson Selection
  const handleLessonSelect = (index: number) => {
    setActiveLessonIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Mark Lesson as Completed
  const handleMarkCompleted = async (lessonId = currentLesson.id) => {
    const newCompleted = completedLessonIds.includes(lessonId)
      ? completedLessonIds
      : [...completedLessonIds, lessonId];
    
    setCompletedLessonIds(newCompleted);

    const totalLessons = lessons.length;
    const newPercent = Math.min(100, Math.round((newCompleted.length / totalLessons) * 100));
    setProgressPercent(newPercent);

    await updateCourseProgress(course.id, newPercent);
    showToast(`درس «${currentLesson.title}» تکمیل شد! (+۴۰ امتیاز نوآفری)`, 'success');

    // Auto advance to next lesson if available
    if (activeLessonIndex < lessons.length - 1) {
      handleLessonSelect(activeLessonIndex + 1);
    }
  };

  // Handle Local Video File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileBlobUrl = URL.createObjectURL(file);
    setTempVideoBlobUrl(fileBlobUrl);
    setUploadedFileName(file.name);
    setVideoInputUrl(fileBlobUrl);
  };

  // Save Uploaded Video to Course/Lesson
  const handleSaveVideo = async () => {
    const targetUrl = videoInputUrl.trim() || tempVideoBlobUrl;
    if (!targetUrl) {
      showToast('لطفاً یک فایل ویدیویی انتخاب کنید یا آدرس آن را وارد نمایید.', 'error');
      return;
    }

    try {
      await updateCourseVideo(course.id, targetUrl, activeLessonIndex);
      currentLesson.videoUrl = targetUrl;
      showToast('ویدیو با موفقیت بارگذاری و برای این درس ثبت گردید!', 'success');
      setIsUploadModalOpen(false);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.src = targetUrl;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      showToast('خطا در ذخیره‌سازی ویدیو.', 'error');
    }
  };

  // Add New Lesson to Course
  const handleAddNewLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) {
      showToast('لطفاً عنوان سرفصل را وارد کنید.', 'error');
      return;
    }

    try {
      await addCourseLesson(course.id, {
        title: newLessonTitle.trim(),
        durationMinutes: Number(newLessonMinutes) || 15,
        videoUrl: newLessonVideoUrl.trim() || course.videoUrl,
      });

      showToast(`سرفصل جدید «${newLessonTitle}» به دوره اضافه شد.`, 'success');
      setIsAddLessonOpen(false);
      setNewLessonTitle('');
      setNewLessonMinutes(15);
      setNewLessonVideoUrl('');
    } catch {
      showToast('خطا در ثبت سرفصل جدید.', 'error');
    }
  };

  return (
    <div className="space-y-6" id="course-player-root">
      {/* Top Action Bar: Upload Video & Add Lesson (Visible ONLY to Admins/Operators) */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-ink-900 via-sky-950 to-ink-900 p-3.5 rounded-xl border border-sky-800/60 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-amber-300 block">پنل راهبری دوره (مخصوص مدیران ارشد)</span>
              <span className="text-[11px] text-ink-300">مدیریت ویدیو، آپلود رسانه و تنظیم سرفصل‌های آموزشی</span>
            </div>
            <Chip size="sm" variant="sky" className="font-sans font-bold text-[10px]">
              Admin Tools
            </Chip>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsUploadModalOpen(true)}
              rightIcon={<Upload className="w-3.5 h-3.5" />}
              className="bg-ink-800 hover:bg-ink-700 text-white border-ink-700 h-8 text-xs font-semibold"
            >
              آپلود / تعویض ویدیوی درس
            </Button>

            <Button
              size="sm"
              variant="accent"
              onClick={() => setIsAddLessonOpen(true)}
              rightIcon={<Plus className="w-3.5 h-3.5" />}
              className="h-8 text-xs font-bold"
            >
              افزودن سرفصل جدید
            </Button>
          </div>
        </div>
      )}

      {/* Main Video & Playlist Container */}
      <div
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-3 gap-0 bg-ink-950 rounded-2xl overflow-hidden shadow-2xl border border-ink-800 text-white"
      >
        {/* Left/Main Column: Real Video Screen (2 cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between aspect-video bg-black relative group overflow-hidden select-none">
          {isEmbed ? (
            /* Embed Player (Aparat / YouTube / Vimeo) */
            <div className="w-full h-full relative">
              <iframe
                src={activeVideoUrl}
                title={currentLesson.title}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            /* Native HTML5 Video Player */
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={activeVideoUrl}
                poster={course.heroImage?.url || course.posterUrl || '/mock/course-thumb.svg'}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => handleMarkCompleted(currentLesson.id)}
                onClick={handlePlayPause}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />

              {/* Big Center Play/Pause Button on Hover / Paused */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="absolute w-20 h-20 rounded-full bg-sky-600/90 text-white hover:bg-sky-500 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 z-20 cursor-pointer backdrop-blur-xs"
                  aria-label="پخش ویدیو"
                >
                  <Play className="w-9 h-9 ms-1 fill-white" />
                </button>
              )}
            </div>
          )}

          {/* Top Video Header Overlay */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-95 group-hover:opacity-100 transition-opacity">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs text-sky-400 font-bold block">
                درس {toFaDigits(activeLessonIndex + 1)} از {toFaDigits(lessons.length)}:
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                {currentLesson.title}
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  title="تغییر یا آپلود ویدیو (مخصوص مدیران)"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline text-[11px]">تعویض ویدیو</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Player Controls Overlay (for HTML5 Video) */}
          {!isEmbed && (
            <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {/* Scrub / Progress Bar */}
              <div
                onClick={handleSeek}
                className="w-full bg-white/20 hover:bg-white/30 h-2 rounded-full overflow-hidden cursor-pointer relative group/track transition-all"
              >
                <div
                  className="bg-sky-500 h-full relative rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute end-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/track:scale-100 transition-transform" />
                </div>
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between text-xs text-ink-200">
                {/* Left Controls: Play/Pause, Volume, Time */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'توقف' : 'پخش'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>

                  <div className="flex items-center gap-1.5 group/vol relative">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-pink-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 accent-sky-500 bg-white/30 rounded-lg cursor-pointer"
                    />
                  </div>

                  <span className="font-sans text-xs tracking-wider text-ink-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls: Speed, Mark Complete, Fullscreen */}
                <div className="flex items-center gap-2">
                  {/* Speed Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-sans font-bold cursor-pointer"
                    >
                      {playbackRate}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-full end-0 mb-2 bg-ink-900 border border-ink-700 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 z-30 min-w-20">
                        {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleSpeedChange(rate)}
                            className={cn(
                              'px-2.5 py-1 text-xs text-start rounded transition-colors font-sans cursor-pointer',
                              playbackRate === rate ? 'bg-sky-600 text-white font-bold' : 'hover:bg-ink-800 text-ink-300'
                            )}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mark Completed Button */}
                  <Button
                    size="sm"
                    variant={completedLessonIds.includes(currentLesson.id) ? 'secondary' : 'accent'}
                    onClick={() => handleMarkCompleted(currentLesson.id)}
                    rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    className="h-7 text-xs py-0 font-bold"
                  >
                    {completedLessonIds.includes(currentLesson.id) ? 'تکمیل‌شده' : 'تکمیل و درس بعدی'}
                  </Button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                    aria-label="تمام صفحه"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Lessons Playlist Sidebar (1 col) */}
        <div className="p-4 bg-ink-900/95 flex flex-col justify-between border-t lg:border-t-0 lg:border-s border-ink-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">سرفصل‌های آموزشی</h4>
                <span className="text-xs text-ink-400">
                  {toFaDigits(completedLessonIds.length)} از {toFaDigits(lessons.length)} درس گذرانده‌شده
                </span>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAddLessonOpen(true)}
                  className="p-1.5 rounded-md bg-ink-800 hover:bg-ink-700 text-sky-400 text-xs flex items-center gap-1 border border-ink-700 cursor-pointer"
                  title="افزودن درس جدید (مخصوص مدیران)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>درس جدید</span>
                </button>
              )}
            </div>

            {/* Lessons List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pe-1 scrollbar-thin">
              {lessons.map((lesson, idx) => {
                const isActive = idx === activeLessonIndex;
                const isCompleted = completedLessonIds.includes(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      'p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all border',
                      isActive
                        ? 'bg-sky-600 text-white font-bold border-sky-400 shadow-md'
                        : 'bg-ink-800/70 text-ink-300 hover:bg-ink-800 hover:text-white border-ink-700/50'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleLessonSelect(idx)}
                      className="flex items-center gap-2.5 overflow-hidden text-start flex-1 cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <Play className="w-4 h-4 text-white shrink-0 fill-white" />
                      ) : (
                        <span className="text-[11px] text-ink-500 shrink-0 font-sans w-4 text-center">
                          {toFaDigits(idx + 1)}.
                        </span>
                      )}
                      <div className="truncate">
                        <span className="truncate block">{lesson.title}</span>
                        {lesson.description && (
                          <span className="text-[10px] opacity-70 truncate block">{lesson.description}</span>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 ms-2">
                      <span className="text-[10px] opacity-75 font-sans">
                        {formatMinutes(lesson.durationMinutes)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Summary at Bottom */}
          <div className="pt-4 border-t border-ink-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-ink-400">پیشرفت کل دوره:</span>
              <span className="text-sky-400 font-sans font-bold">
                {toFaDigits(progressPercent)}٪
              </span>
            </div>
            <ProgressBar percent={progressPercent} showLabel={false} color="sky" height="md" />
            
            <p className="text-[11px] text-ink-400 leading-tight flex items-center gap-1.5 pt-1">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>با تکمیل کل سرفصل‌ها +۱۵۰ امتیاز نوآفری دریافت می‌کنید.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL: Upload / Change Video for Lesson */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ink-900 border border-ink-700 text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-ink-800 flex items-center justify-between bg-ink-950">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold">بارگذاری یا تغییر ویدیوی درس</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              <div className="bg-ink-800/60 p-3 rounded-xl border border-ink-700/60 text-xs text-ink-300">
                <span className="text-white font-bold block mb-1">درس در حال ویرایش:</span>
                <p className="text-sky-300 font-medium">{currentLesson.title}</p>
              </div>

              {/* Upload Option 1: File from Computer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-200 block">
                  روش ۱: انتخاب فایل ویدیویی از رایانه (MP4 / WebM / MKV)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink-600 hover:border-sky-500 rounded-xl p-6 text-center cursor-pointer bg-ink-800/40 hover:bg-ink-800 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mkv,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FileVideo className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white mb-1">
                    {uploadedFileName || 'کلیک کنید یا فایل ویدیویی را اینجا بکشید و رها کنید'}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    پشتیبانی از فایل‌های MP4, WebM تا سقف ۱۰۰ مگابایت
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-ink-500 text-xs">
                <div className="h-px bg-ink-800 flex-1" />
                <span>یا</span>
                <div className="h-px bg-ink-800 flex-1" />
              </div>

              {/* Upload Option 2: Direct URL / Aparat / YouTube */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-200 block">
                  روش ۲: نشانی اینترنتی ویدیو (لینک مستقیم MP4 یا لینک آپارات/یوتیوب)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://example.com/video.mp4 یا https://www.aparat.com/v/..."
                    value={videoInputUrl}
                    onChange={(e) => setVideoInputUrl(e.target.value)}
                    className="w-full bg-ink-950 border border-ink-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-sky-500 font-sans"
                  />
                  <LinkIcon className="w-4 h-4 text-ink-500 absolute end-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-ink-800 bg-ink-950 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsUploadModalOpen(false)}
                className="bg-ink-800 text-ink-300 hover:text-white border-ink-700"
              >
                انصراف
              </Button>

              <Button
                variant="accent"
                size="sm"
                onClick={handleSaveVideo}
                rightIcon={<Check className="w-4 h-4" />}
                className="font-bold"
              >
                ذخیره و پخش ویدیو
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: Add New Lesson to Course */}
      {/* ========================================================================= */}
      {isAddLessonOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewLesson}
            className="bg-ink-900 border border-ink-700 text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-ink-800 flex items-center justify-between bg-ink-950">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold">افزودن سرفصل جدید به دوره</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLessonOpen(false)}
                className="p-1 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-200 block mb-1.5">
                  عنوان درسنامه *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تکنیک‌های مصاحبه عمیق با جامعه هدف"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-200 block mb-1.5">
                  مدت زمان درس (دقیقه)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={newLessonMinutes}
                  onChange={(e) => setNewLessonMinutes(Number(e.target.value))}
                  className="w-full bg-ink-950 border border-ink-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-200 block mb-1.5">
                  آدرس ویدیوی این درس (اختیاری)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://..."
                  value={newLessonVideoUrl}
                  onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-ink-800 bg-ink-950 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddLessonOpen(false)}
                className="bg-ink-800 text-ink-300 hover:text-white border-ink-700"
              >
                انصراف
              </Button>

              <Button
                type="submit"
                variant="accent"
                size="sm"
                rightIcon={<Plus className="w-4 h-4" />}
                className="font-bold"
              >
                ثبت و افزودن سرفصل
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
